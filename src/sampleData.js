import { getCurrentTaxYearId } from "./taxRules.js";

export const blankRow = (kind) => {
  const id = crypto.randomUUID();
  const rows = {
    salary: { id, label: "Basic salary", amount: 1800000, notes: "" },
    salaryExemption: { id, section: "HRA", amount: 0, notes: "" },
    property: { id, description: "Bengaluru apartment", annualRent: 360000, municipalTaxes: 12000, interest: 180000, ownership: 100 },
    interest: { id, type: "Savings interest", source: "Bank", amount: 12000 },
    dividend: { id, market: "India", company: "Listed company", grossAmount: 25000, taxWithheld: 2500 },
    equityComp: {
      id,
      type: "RSU vest",
      employer: "Employer Inc.",
      market: "US",
      eventDate: "2025-09-15",
      quantity: 10,
      perquisiteValue: 150000,
      costBasis: 150000,
      saleValue: 0,
      taxWithheld: 30000
    },
    capitalGain: {
      id,
      type: "Indian listed equity - LTCG 112A",
      asset: "Equity shares",
      buyDate: "2024-04-15",
      saleDate: "2025-12-10",
      saleValue: 450000,
      costBasis: 300000,
      expenses: 500,
      holdingPeriod: "Long term"
    },
    deduction: { id, section: "80C", description: "PF / ELSS / life insurance", amount: 150000 },
    taxPaid: { id, type: "Salary TDS", source: "Employer", amount: 220000 },
    otherIncome: { id, type: "Other taxable income", source: "Misc", amount: 0 }
  };
  return rows[kind];
};

export const initialData = {
  profile: {
    name: "Taxpayer",
    residency: "Resident",
    ageCategory: "below60",
    regimePreference: "auto",
    taxYearId: getCurrentTaxYearId()
  },
  salaryRows: [blankRow("salary"), { ...blankRow("salary"), label: "Annual bonus", amount: 300000 }],
  salaryExemptionRows: [{ ...blankRow("salaryExemption"), section: "HRA", amount: 120000 }],
  propertyRows: [blankRow("property")],
  interestRows: [blankRow("interest"), { ...blankRow("interest"), type: "FD/RD interest", source: "Fixed deposit", amount: 45000 }],
  dividendRows: [blankRow("dividend"), { ...blankRow("dividend"), market: "US", company: "US listed shares", grossAmount: 90000, taxWithheld: 22500 }],
  equityCompRows: [blankRow("equityComp")],
  capitalGainRows: [blankRow("capitalGain")],
  deductionRows: [blankRow("deduction"), { ...blankRow("deduction"), section: "80D", description: "Health insurance", amount: 25000 }],
  taxesPaidRows: [blankRow("taxPaid"), { ...blankRow("taxPaid"), type: "Foreign tax withheld", source: "US broker", amount: 22500 }],
  otherIncomeRows: [blankRow("otherIncome")]
};
