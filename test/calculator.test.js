import assert from "node:assert/strict";
import test from "node:test";

import { calculateTax } from "../src/calculator.js";

const emptyData = () => ({
  profile: {
    taxYearId: "fy-2025-26",
    ageCategory: "below60"
  },
  salaryRows: [],
  salaryExemptionRows: [],
  propertyRows: [],
  interestRows: [],
  dividendRows: [],
  equityCompRows: [],
  capitalGainRows: [],
  deductionRows: [],
  taxesPaidRows: [],
  otherIncomeRows: []
});

test("87A rebate does not offset VDA tax", () => {
  const data = emptyData();
  data.capitalGainRows = [
    {
      type: "VDA/Crypto",
      saleValue: 180000,
      costBasis: 100000,
      expenses: 0,
      holdingPeriod: "Short term"
    }
  ];

  const result = calculateTax(data, "new");

  assert.equal(result.taxableIncome, 80000);
  assert.equal(result.specialRateTax, 24000);
  assert.equal(result.rebate, 0);
  assert.equal(result.totalTax, 24960);
});

test("a losing VDA transfer cannot offset a profitable transfer", () => {
  const data = emptyData();
  data.capitalGainRows = [
    {
      type: "VDA/Crypto",
      saleValue: 180000,
      costBasis: 100000,
      expenses: 0,
      holdingPeriod: "Short term"
    },
    {
      type: "VDA/Crypto",
      saleValue: 70000,
      costBasis: 100000,
      expenses: 0,
      holdingPeriod: "Short term"
    }
  ];

  const result = calculateTax(data, "new");

  assert.equal(result.capitalGains.vda, 80000);
  assert.equal(result.specialRateTax, 24000);
  assert.equal(result.totalTax, 24960);
});

test("87A continues to offset eligible slab-rate tax", () => {
  const data = emptyData();
  data.salaryRows = [{ amount: 875000 }];

  const result = calculateTax(data, "new");

  assert.equal(result.taxableIncome, 800000);
  assert.equal(result.slabTax, 20000);
  assert.equal(result.rebate, 20000);
  assert.equal(result.totalTax, 0);
});
