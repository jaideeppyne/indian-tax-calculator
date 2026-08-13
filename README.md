# Indian Income Tax Calculator

A React/Vite calculator for Indian income tax planning with old and new regime comparison.

## Features

- Tax-year selector for FY 2025-26 / AY 2026-27 and current running Tax Year/FY 2026-27 / AY 2027-28
- Old vs new tax regime comparison
- Multiple line entries for salary, exemptions, house property, interest, dividends, ESOP/ESPP/RSU, capital gains, deductions, and taxes paid
- Indian and US/foreign equity compensation and dividends
- Capital-gains categories for listed equity, mutual funds, foreign shares, property, VDA/crypto, and other assets
- Regime-specific tax-saving suggestions with estimated savings where caps are known
- Disclosure checklist for AIS/TIS/Form 26AS, Schedule CG, Schedule FA/FSI/TR, and Form 67

## Local development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Build

```bash
npm run build
```

The static build is written to `dist/`.

## Cloudflare Pages

This app can be deployed to Cloudflare Pages Free.

- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: leave blank for normal Pages Git deployments, or use `npx wrangler pages deploy dist --project-name=indian-tax-calculator`

Do not use `npx wrangler deploy` unless you intentionally deploy this as a Workers Static Assets project.

Direct deploy:

```bash
npm run deploy:cloudflare
```

## Notes

This is a planning calculator, not tax advice. Verify outputs against the Income Tax Department utility, AIS/TIS/Form 26AS, and a qualified tax professional before filing.

The engine keeps special-rate income separate from slab income. For AY 2026-27,
the new-regime Section 87A rebate is limited to tax payable at the Section
115BAC(1A) slab rates, and a loss from one VDA transfer is not netted against a
profitable VDA transfer.

Rule references:

- Income Tax Department, [special regimes and the AY 2026-27 Section 87A limit](https://www.incometaxindia.gov.in/w/special-regimes-for-taxation-of-individuals-huf-aop-boi-ajp-companies-and-co-operative-societies)
- Income Tax Department, [Section 115BBH](https://www.incometaxindia.gov.in/w/section-115bbh-5)
- Income Tax Department, [Schedule VDA transaction-wise reporting](https://www.incometaxindia.gov.in/w/schedule_vda)
