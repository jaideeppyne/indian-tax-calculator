import { DEDUCTION_LIMITS, REGIME_ALLOWED_DEDUCTIONS, getRuleYear, SLABS } from "./taxRules.js";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Math.round(toNumber(value)));

export const sumBy = (rows, key) => rows.reduce((sum, row) => sum + toNumber(row[key]), 0);

const calculateSlabTax = (income, slabs) => {
  let previousLimit = 0;
  let tax = 0;

  slabs.forEach(([limit, rate]) => {
    if (income > previousLimit) {
      const taxableAtThisRate = Math.min(income, limit) - previousLimit;
      tax += taxableAtThisRate * rate;
      previousLimit = limit;
    }
  });

  return tax;
};

const pickOldSlabs = (ageCategory) => {
  if (ageCategory === "superSenior") return SLABS.oldSuperSenior;
  if (ageCategory === "senior") return SLABS.oldSenior;
  return SLABS.oldBelow60;
};

const capDeduction = (section, amount) => {
  const limit = DEDUCTION_LIMITS[section];
  return typeof limit === "number" ? Math.min(amount, limit) : amount;
};

const computeHousePropertyIncome = (properties, ruleYear) =>
  properties.reduce((total, property) => {
    const grossAnnualValue = toNumber(property.annualRent) - toNumber(property.municipalTaxes);
    const standardDeduction = Math.max(grossAnnualValue, 0) * ruleYear.housePropertyStandardDeductionRate;
    const net = grossAnnualValue - standardDeduction - toNumber(property.interest);
    return total + net;
  }, 0);

const computeOtherIncome = (data) => {
  const interest = sumBy(data.interestRows, "amount");
  const dividends = sumBy(data.dividendRows, "grossAmount");
  const familyPensionGross = sumBy(data.otherIncomeRows.filter((row) => row.type === "Family pension"), "amount");
  const other = sumBy(data.otherIncomeRows.filter((row) => row.type !== "Family pension"), "amount");
  return { interest, dividends, familyPensionGross, other };
};

const computeEquityComp = (rows) =>
  rows.reduce(
    (totals, row) => {
      const perquisite = toNumber(row.perquisiteValue);
      const gain = toNumber(row.saleValue) - toNumber(row.costBasis);
      return {
        salaryPerquisite: totals.salaryPerquisite + perquisite,
        capitalGain: totals.capitalGain + gain,
        foreignIncome: totals.foreignIncome + (row.market === "US" ? perquisite + Math.max(gain, 0) : 0)
      };
    },
    { salaryPerquisite: 0, capitalGain: 0, foreignIncome: 0 }
  );

const computeCapitalGains = (rows, equityCompGain, ruleYear) => {
  const totals = {
    stcg111a: 0,
    ltcg112a: 0,
    otherShortTerm: 0,
    otherLongTerm: 0,
    vda: 0
  };

  rows.forEach((row) => {
    const gain = toNumber(row.saleValue) - toNumber(row.costBasis) - toNumber(row.expenses);
    if (row.type.includes("STCG 111A")) totals.stcg111a += gain;
    else if (row.type.includes("LTCG 112A")) totals.ltcg112a += gain;
    else if (row.type.includes("VDA")) totals.vda += gain;
    else if (row.holdingPeriod === "Long term") totals.otherLongTerm += gain;
    else totals.otherShortTerm += gain;
  });

  totals.otherShortTerm += equityCompGain;
  totals.ltcg112a = Math.max(0, totals.ltcg112a - ruleYear.section112AExemption);
  return totals;
};

const computeAllowedDeductions = (deductionRows, regime, isSenior, interestIncome) =>
  deductionRows.reduce((sum, row) => {
    if (!REGIME_ALLOWED_DEDUCTIONS[regime].has(row.section)) return sum;
    let amount = toNumber(row.amount);

    if (row.section === "80TTA" && !isSenior) {
      amount = Math.min(interestIncome, amount, DEDUCTION_LIMITS["80TTA"]);
    } else if (row.section === "80TTB" && isSenior) {
      amount = Math.min(interestIncome, amount, DEDUCTION_LIMITS["80TTB"]);
    } else if (row.section === "80TTA" || row.section === "80TTB") {
      amount = 0;
    } else {
      amount = capDeduction(row.section, amount);
    }

    return sum + amount;
  }, 0);

const computeSpecialRateTax = (capitalGains, dividends) => {
  const stcgTax = Math.max(capitalGains.stcg111a, 0) * 0.2;
  const ltcg112aTax = Math.max(capitalGains.ltcg112a, 0) * 0.125;
  const vdaTax = Math.max(capitalGains.vda, 0) * 0.3;
  const specialDividendTax = Math.max(dividends.foreign, 0) * 0;
  return stcgTax + ltcg112aTax + vdaTax + specialDividendTax;
};

const computeSurchargeRate = (totalIncome) => {
  if (totalIncome > 50000000) return 0.37;
  if (totalIncome > 20000000) return 0.25;
  if (totalIncome > 10000000) return 0.15;
  if (totalIncome > 5000000) return 0.1;
  return 0;
};

export const calculateTax = (data, regime) => {
  const ruleYear = getRuleYear(data.profile.taxYearId);
  const ageCategory = data.profile.ageCategory;
  const isSenior = ageCategory === "senior" || ageCategory === "superSenior";
  const equityComp = computeEquityComp(data.equityCompRows);
  const salaryGross = sumBy(data.salaryRows, "amount") + equityComp.salaryPerquisite;
  const salaryDeduction =
    salaryGross > 0
      ? regime === "new"
        ? ruleYear.standardDeductionSalaryNew
        : ruleYear.standardDeductionSalaryOld
      : 0;
  const salaryIncome = Math.max(0, salaryGross - salaryDeduction - (regime === "old" ? sumBy(data.salaryExemptionRows, "amount") : 0));
  const housePropertyIncome = computeHousePropertyIncome(data.propertyRows, ruleYear);
  const otherIncome = computeOtherIncome(data);
  const familyPensionDeduction =
    otherIncome.familyPensionGross > 0
      ? Math.min(
          otherIncome.familyPensionGross / 3,
          regime === "new" ? ruleYear.familyPensionDeductionNew : ruleYear.familyPensionDeductionOld
        )
      : 0;
  const capitalGains = computeCapitalGains(data.capitalGainRows, equityComp.capitalGain, ruleYear);
  const normalCapitalGains = capitalGains.otherShortTerm + capitalGains.otherLongTerm;
  const grossTotalIncome =
    salaryIncome +
    housePropertyIncome +
    otherIncome.interest +
    otherIncome.dividends +
    otherIncome.familyPensionGross -
    familyPensionDeduction +
    otherIncome.other +
    normalCapitalGains +
    Math.max(capitalGains.stcg111a, 0) +
    Math.max(capitalGains.ltcg112a, 0) +
    Math.max(capitalGains.vda, 0);

  const allowedDeductions = computeAllowedDeductions(data.deductionRows, regime, isSenior, otherIncome.interest);
  const taxableIncome = Math.max(0, grossTotalIncome - allowedDeductions);
  const specialIncome = Math.max(capitalGains.stcg111a, 0) + Math.max(capitalGains.ltcg112a, 0) + Math.max(capitalGains.vda, 0);
  const slabIncome = Math.max(0, taxableIncome - specialIncome);
  const slabTax = calculateSlabTax(slabIncome, regime === "new" ? SLABS.new : pickOldSlabs(ageCategory));
  const specialRateTax = computeSpecialRateTax(capitalGains, { foreign: 0 });
  const beforeRebate = slabTax + specialRateTax;
  const rebateLimit = regime === "new" ? ruleYear.newRegimeRebateLimit : ruleYear.oldRegimeRebateLimit;
  const rebateAmount = regime === "new" ? ruleYear.newRegimeRebateAmount : ruleYear.oldRegimeRebateAmount;
  const rebate = taxableIncome <= rebateLimit ? Math.min(beforeRebate, rebateAmount) : 0;
  const afterRebate = Math.max(0, beforeRebate - rebate);
  const surcharge = afterRebate * computeSurchargeRate(taxableIncome);
  const cess = (afterRebate + surcharge) * ruleYear.cessRate;
  const totalTax = afterRebate + surcharge + cess;
  const taxesPaid = sumBy(data.taxesPaidRows, "amount");
  const payable = totalTax - taxesPaid;

  return {
    regime,
    ruleYear,
    salaryGross,
    salaryIncome,
    housePropertyIncome,
    otherIncome,
    capitalGains,
    grossTotalIncome,
    allowedDeductions,
    taxableIncome,
    slabTax,
    specialRateTax,
    rebate,
    surcharge,
    cess,
    totalTax,
    taxesPaid,
    payable,
    foreignIncome: equityComp.foreignIncome + sumBy(data.dividendRows.filter((row) => row.market === "US"), "grossAmount")
  };
};

export const compareRegimes = (data) => {
  const oldRegime = calculateTax(data, "old");
  const newRegime = calculateTax(data, "new");
  const recommended = oldRegime.totalTax <= newRegime.totalTax ? "old" : "new";
  return { old: oldRegime, new: newRegime, recommended };
};

const usedDeduction = (data, section) =>
  data.deductionRows
    .filter((row) => row.section === section)
    .reduce((sum, row) => sum + toNumber(row.amount), 0);

const estimateDeductionBenefit = (data, regime, section, amount) => {
  if (amount <= 0) return 0;
  const current = calculateTax(data, regime).totalTax;
  const trial = {
    ...data,
    deductionRows: [
      ...data.deductionRows,
      {
        id: `suggestion-${section}`,
        section,
        description: "Suggestion estimate",
        amount
      }
    ]
  };
  return Math.max(0, current - calculateTax(trial, regime).totalTax);
};

const fixedSuggestion = (data, regime, section, title, cap, note) => {
  const remaining = Math.max(0, cap - usedDeduction(data, section));
  return {
    section,
    title,
    regime,
    remaining,
    estimatedSaving: estimateDeductionBenefit(data, regime, section, remaining),
    note,
    actionable: remaining > 0
  };
};

export const getTaxSavingSuggestions = (data) => {
  const ruleYear = getRuleYear(data.profile.taxYearId);
  const isSenior = data.profile.ageCategory === "senior" || data.profile.ageCategory === "superSenior";
  const interestIncome = sumBy(data.interestRows, "amount");
  const oldSuggestions = [
    fixedSuggestion(data, "old", "80C", "Use remaining 80C basket", 150000, "PF, PPF, ELSS, life insurance, principal repayment and similar eligible items."),
    fixedSuggestion(data, "old", "80CCD(1B)", "Additional NPS contribution", 50000, "Extra NPS deduction over and above 80C, if you invest personally."),
    fixedSuggestion(data, "old", "80D", "Health insurance premium", isSenior ? 50000 : 25000, "Base self/family limit only; parent and preventive-health limits need separate fact capture."),
    fixedSuggestion(
      data,
      "old",
      isSenior ? "80TTB" : "80TTA",
      isSenior ? "Senior-citizen interest deduction" : "Savings interest deduction",
      Math.min(interestIncome, isSenior ? ruleYear.seniorInterestDeductionLimit : ruleYear.savingsInterestDeductionLimit),
      isSenior ? "Applies to eligible interest for senior citizens." : "Applies to savings-account interest, not FD interest."
    )
  ];

  const newSuggestions = [
    {
      section: "80CCD(2)",
      title: "Employer NPS contribution",
      regime: "new",
      remaining: 0,
      estimatedSaving: 0,
      note: "Allowed in the new regime. Ask payroll to route eligible employer NPS contribution; cap depends on salary and employer category.",
      actionable: true
    },
    {
      section: "80CCH",
      title: "Agniveer Corpus Fund",
      regime: "new",
      remaining: 0,
      estimatedSaving: 0,
      note: "Allowed only where the taxpayer is eligible for Agnipath/Agniveer contribution deduction.",
      actionable: true
    }
  ];

  const oldEligibilityOnly = [
    ["HRA", "House Rent Allowance", "Useful only if you receive HRA and pay eligible rent."],
    ["LTA", "Leave Travel Allowance", "Use if your employer provides LTA and you have eligible travel proof."],
    ["80GG", "Rent paid without HRA", "Useful if you pay rent but do not receive HRA."],
    ["80E", "Education loan interest", "No fixed rupee cap; available for eligible education-loan interest."],
    ["80G", "Eligible donations", "Deduction depends on donee type, qualifying limit and receipt details."],
    ["80DD/80DDB/80U", "Medical/disability deductions", "Use if applicable based on disability or specified-disease rules."]
  ].map(([section, title, note]) => ({ section, title, regime: "old", remaining: 0, estimatedSaving: 0, note, actionable: true }));

  return {
    old: [...oldSuggestions, ...oldEligibilityOnly],
    new: newSuggestions
  };
};
