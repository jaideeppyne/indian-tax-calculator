const SHARED_RULES = {
  cessRate: 0.04,
  standardDeductionSalaryNew: 75000,
  standardDeductionSalaryOld: 50000,
  familyPensionDeductionNew: 25000,
  familyPensionDeductionOld: 15000,
  housePropertyStandardDeductionRate: 0.3,
  savingsInterestDeductionLimit: 10000,
  seniorInterestDeductionLimit: 50000,
  newRegimeRebateLimit: 1200000,
  newRegimeRebateAmount: 60000,
  oldRegimeRebateLimit: 500000,
  oldRegimeRebateAmount: 12500,
  section112AExemption: 125000
};

export const TAX_YEARS = {
  "fy-2025-26": {
    id: "fy-2025-26",
    label: "FY 2025-26 / AY 2026-27",
    shortLabel: "FY 2025-26",
    financialYear: "2025-26",
    assessmentYear: "2026-27",
    status: "Return filing year",
    ...SHARED_RULES
  },
  "fy-2026-27": {
    id: "fy-2026-27",
    label: "Tax Year 2026-27 / AY 2027-28",
    shortLabel: "TY 2026-27",
    financialYear: "2026-27",
    assessmentYear: "2027-28",
    status: "Current running year",
    ...SHARED_RULES
  }
};

export const DEFAULT_TAX_YEAR_ID = "fy-2025-26";
export const CURRENT_TAX_YEAR_ID = "fy-2026-27";

export const getCurrentTaxYearId = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const financialStartYear = month >= 3 ? year : year - 1;
  const id = `fy-${financialStartYear}-${String((financialStartYear + 1) % 100).padStart(2, "0")}`;
  return TAX_YEARS[id] ? id : CURRENT_TAX_YEAR_ID;
};

export const getRuleYear = (taxYearId) => TAX_YEARS[taxYearId] ?? TAX_YEARS[DEFAULT_TAX_YEAR_ID];

export const RULE_YEAR = TAX_YEARS[DEFAULT_TAX_YEAR_ID];

export const SLABS = {
  oldBelow60: [
    [250000, 0],
    [500000, 0.05],
    [1000000, 0.2],
    [Infinity, 0.3]
  ],
  oldSenior: [
    [300000, 0],
    [500000, 0.05],
    [1000000, 0.2],
    [Infinity, 0.3]
  ],
  oldSuperSenior: [
    [500000, 0],
    [1000000, 0.2],
    [Infinity, 0.3]
  ],
  new: [
    [400000, 0],
    [800000, 0.05],
    [1200000, 0.1],
    [1600000, 0.15],
    [2000000, 0.2],
    [2400000, 0.25],
    [Infinity, 0.3]
  ]
};

export const REGIME_ALLOWED_DEDUCTIONS = {
  old: new Set([
    "80C",
    "80CCD(1B)",
    "80D",
    "80DD",
    "80DDB",
    "80E",
    "80EE",
    "80EEA",
    "80EEB",
    "80G",
    "80GGA",
    "80GGC",
    "80GG",
    "80TTA",
    "80TTB",
    "80U",
    "HRA",
    "LTA",
    "10(14)",
    "Other"
  ]),
  new: new Set(["80CCD(2)", "80CCH", "OtherNewAllowed"])
};

export const DEDUCTION_LIMITS = {
  "80C": 150000,
  "80CCD(1B)": 50000,
  "80TTA": SHARED_RULES.savingsInterestDeductionLimit,
  "80TTB": SHARED_RULES.seniorInterestDeductionLimit
};

export const SECTION_OPTIONS = [
  "80C",
  "80CCD(1B)",
  "80CCD(2)",
  "80CCH",
  "80D",
  "80DD",
  "80DDB",
  "80E",
  "80EE",
  "80EEA",
  "80EEB",
  "80G",
  "80GGA",
  "80GGC",
  "80GG",
  "80TTA",
  "80TTB",
  "80U",
  "HRA",
  "LTA",
  "10(14)",
  "Other",
  "OtherNewAllowed"
];

export const INCOME_TYPES = {
  interest: ["Savings interest", "FD/RD interest", "Bond interest", "Other interest"],
  dividend: ["Indian listed dividend", "US listed dividend", "Other foreign dividend"],
  capitalGain: [
    "Indian listed equity - STCG 111A",
    "Indian listed equity - LTCG 112A",
    "Equity mutual fund - STCG 111A",
    "Equity mutual fund - LTCG 112A",
    "Debt mutual fund",
    "REIT/InvIT",
    "Unlisted shares",
    "Foreign shares",
    "Property",
    "Gold/Bonds/Other",
    "VDA/Crypto"
  ],
  equityComp: ["RSU vest", "ESOP exercise", "ESPP purchase discount", "Share sale"]
};
