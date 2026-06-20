import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Banknote,
  Building2,
  CircleDollarSign,
  IndianRupee,
  FileText,
  Home,
  Landmark,
  Plus,
  ReceiptText,
  Scale,
  ShieldCheck,
  Trash2,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { compareRegimes, getTaxSavingSuggestions, money } from "./calculator.js";
import { blankRow, initialData } from "./sampleData.js";
import { INCOME_TYPES, SECTION_OPTIONS, TAX_YEARS, getRuleYear } from "./taxRules.js";
import "./styles.css";

const sections = [
  { id: "profile", label: "Profile", icon: FileText },
  { id: "salary", label: "Salary", icon: WalletCards },
  { id: "equity", label: "ESOP / RSU", icon: CircleDollarSign },
  { id: "property", label: "House Property", icon: Home },
  { id: "income", label: "Interest & Dividend", icon: Landmark },
  { id: "capital", label: "Capital Gains", icon: TrendingUp },
  { id: "deductions", label: "Deductions", icon: ShieldCheck },
  { id: "taxes", label: "Taxes Paid", icon: ReceiptText }
];

const fieldMeta = {
  salaryRows: [
    ["label", "Component", "text"],
    ["amount", "Amount", "number"],
    ["notes", "Notes", "text"]
  ],
  salaryExemptionRows: [
    ["section", "Section", "select", ["HRA", "LTA", "10(14)", "Other"]],
    ["amount", "Amount", "number"],
    ["notes", "Notes", "text"]
  ],
  propertyRows: [
    ["description", "Property", "text"],
    ["annualRent", "Annual rent", "number"],
    ["municipalTaxes", "Municipal tax", "number"],
    ["interest", "Loan interest", "number"],
    ["ownership", "Ownership %", "number"]
  ],
  interestRows: [
    ["type", "Type", "select", INCOME_TYPES.interest],
    ["source", "Source", "text"],
    ["amount", "Amount", "number"]
  ],
  dividendRows: [
    ["market", "Market", "select", ["India", "US", "Other foreign"]],
    ["company", "Company / fund", "text"],
    ["grossAmount", "Gross amount", "number"],
    ["taxWithheld", "Tax withheld", "number"]
  ],
  equityCompRows: [
    ["type", "Event", "select", INCOME_TYPES.equityComp],
    ["employer", "Employer", "text"],
    ["market", "Market", "select", ["India", "US", "Other foreign"]],
    ["eventDate", "Date", "date"],
    ["quantity", "Qty", "number"],
    ["perquisiteValue", "Perquisite", "number"],
    ["costBasis", "Cost basis", "number"],
    ["saleValue", "Sale value", "number"],
    ["taxWithheld", "Tax withheld", "number"]
  ],
  capitalGainRows: [
    ["type", "Asset class", "select", INCOME_TYPES.capitalGain],
    ["asset", "Asset", "text"],
    ["buyDate", "Buy date", "date"],
    ["saleDate", "Sale date", "date"],
    ["saleValue", "Sale value", "number"],
    ["costBasis", "Cost basis", "number"],
    ["expenses", "Expenses", "number"],
    ["holdingPeriod", "Term", "select", ["Short term", "Long term"]]
  ],
  deductionRows: [
    ["section", "Section", "select", SECTION_OPTIONS],
    ["description", "Description", "text"],
    ["amount", "Amount", "number"]
  ],
  taxesPaidRows: [
    ["type", "Type", "select", ["Salary TDS", "TDS on interest", "TDS on rent", "Advance tax", "Self-assessment tax", "TCS", "Foreign tax withheld"]],
    ["source", "Source", "text"],
    ["amount", "Amount", "number"]
  ],
  otherIncomeRows: [
    ["type", "Type", "select", ["Family pension", "Gift", "Lottery/race income", "Agricultural income", "Other taxable income"]],
    ["source", "Source", "text"],
    ["amount", "Amount", "number"]
  ]
};

const sectionRows = {
  salary: [
    { title: "Salary components", keyName: "salaryRows", kind: "salary", description: "Add each recurring or one-time salary component separately." },
    { title: "Old-regime salary exemptions", keyName: "salaryExemptionRows", kind: "salaryExemption", description: "HRA, LTA and allowance exemptions are considered only under old regime." }
  ],
  equity: [
    { title: "ESOP / ESPP / RSU events", keyName: "equityCompRows", kind: "equityComp", description: "Capture vest/exercise/purchase events and sale values as separate lines." }
  ],
  property: [
    { title: "Rental and house-property income", keyName: "propertyRows", kind: "property", description: "Each let-out, deemed let-out or co-owned property can be entered separately." }
  ],
  income: [
    { title: "Bank and bond interest", keyName: "interestRows", kind: "interest", description: "Separate savings, FD/RD and other interest for deduction checks." },
    { title: "Dividend income", keyName: "dividendRows", kind: "dividend", description: "India and foreign dividends are kept separate for FTC and disclosure review." },
    { title: "Other income", keyName: "otherIncomeRows", kind: "otherIncome", description: "Use for family pension, gifts, lottery income, agricultural income and residual income." }
  ],
  capital: [
    { title: "Capital-gain transactions", keyName: "capitalGainRows", kind: "capitalGain", description: "Use one row per sale lot or broker summary line." }
  ],
  deductions: [
    { title: "Deductions and exemptions", keyName: "deductionRows", kind: "deduction", description: "The calculator automatically filters deductions by regime." }
  ],
  taxes: [
    { title: "TDS, TCS and taxes paid", keyName: "taxesPaidRows", kind: "taxPaid", description: "Add salary TDS, advance tax, self-assessment tax and foreign tax withheld." }
  ]
};

function Input({ value, type, options, onChange }) {
  if (type === "select") {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)}
    />
  );
}

function LineTable({ title, description, rows, fields, onChange, onAdd, onRemove }) {
  return (
    <section className="work-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button className="icon-button label-button" onClick={onAdd} type="button">
          <Plus size={16} />
          Add row
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {fields.map(([, label]) => (
                <th key={label}>{label}</th>
              ))}
              <th className="action-col"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {fields.map(([key, , type, options]) => (
                  <td key={key}>
                    <Input value={row[key] ?? ""} type={type} options={options} onChange={(value) => onChange(row.id, key, value)} />
                  </td>
                ))}
                <td className="action-col">
                  <button className="icon-button danger" onClick={() => onRemove(row.id)} type="button" aria-label="Remove row">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProfilePanel({ data, updateProfile }) {
  return (
    <section className="work-panel profile-grid">
      <div className="profile-field">
        <label>Taxpayer name</label>
        <input value={data.profile.name} onChange={(event) => updateProfile("name", event.target.value)} />
      </div>
      <div className="profile-field">
        <label>Residential status</label>
        <select value={data.profile.residency} onChange={(event) => updateProfile("residency", event.target.value)}>
          <option>Resident</option>
          <option>RNOR</option>
          <option>NRI</option>
        </select>
      </div>
      <div className="profile-field">
        <label>Age category</label>
        <select value={data.profile.ageCategory} onChange={(event) => updateProfile("ageCategory", event.target.value)}>
          <option value="below60">Below 60</option>
          <option value="senior">Senior citizen</option>
          <option value="superSenior">Super senior citizen</option>
        </select>
      </div>
      <div className="profile-field">
        <label>Tax year</label>
        <select value={data.profile.taxYearId} onChange={(event) => updateProfile("taxYearId", event.target.value)}>
          {Object.values(TAX_YEARS).map((year) => (
            <option key={year.id} value={year.id}>
              {year.label}
            </option>
          ))}
        </select>
      </div>
      <div className="profile-field">
        <label>Regime preference</label>
        <div className="segmented">
          {["auto", "old", "new"].map((regime) => (
            <button
              key={regime}
              className={data.profile.regimePreference === regime ? "active" : ""}
              onClick={() => updateProfile("regimePreference", regime)}
              type="button"
            >
              {regime}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, result, active }) {
  return (
    <div className={`summary-card ${active ? "selected" : ""}`}>
      <div className="summary-card-title">
        <span>{label}</span>
        {active && <strong>Recommended</strong>}
      </div>
      <div className="summary-tax">{money(result.totalTax)}</div>
      <dl>
        <div>
          <dt>Taxable income</dt>
          <dd>{money(result.taxableIncome)}</dd>
        </div>
        <div>
          <dt>Deductions</dt>
          <dd>{money(result.allowedDeductions)}</dd>
        </div>
        <div>
          <dt>Rebate</dt>
          <dd>{money(result.rebate)}</dd>
        </div>
        <div>
          <dt>Payable / refund</dt>
          <dd className={result.payable > 0 ? "payable" : "refund"}>{money(result.payable)}</dd>
        </div>
      </dl>
    </div>
  );
}

function TaxSavingIdeas({ suggestions, recommended }) {
  const orderedRegimes = recommended === "old" ? ["old", "new"] : ["new", "old"];

  return (
    <section className="tax-ideas">
      <div className="ideas-heading">
        <IndianRupee size={18} />
        <h3>Tax-saving ideas</h3>
      </div>
      {orderedRegimes.map((regime) => (
        <div className="idea-group" key={regime}>
          <div className="idea-group-title">
            <span>{regime === "old" ? "Old regime" : "New regime"}</span>
            {regime === recommended && <strong>current best</strong>}
          </div>
          {suggestions[regime].filter((idea) => idea.actionable).map((idea) => (
            <div className="idea-row" key={`${regime}-${idea.section}-${idea.title}`}>
              <div>
                <span>{idea.section}</span>
                <strong>{idea.title}</strong>
                <p>{idea.note}</p>
              </div>
              <aside>
                {idea.remaining > 0 && <span>{money(idea.remaining)}</span>}
                {idea.estimatedSaving > 0 && <strong>{money(idea.estimatedSaving)}</strong>}
              </aside>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

function SummaryPanel({ comparison, suggestions, ruleYear }) {
  const recommended = comparison.recommended;
  const selected = comparison[recommended];
  const hasForeign = selected.foreignIncome > 0;
  const hasCapitalGains =
    selected.capitalGains.stcg111a + selected.capitalGains.ltcg112a + selected.capitalGains.otherShortTerm + selected.capitalGains.otherLongTerm > 0;

  return (
    <aside className="summary-panel">
      <div className="summary-header">
        <Scale size={20} />
        <div>
          <h2>Regime comparison</h2>
          <p>{ruleYear.label}</p>
        </div>
      </div>
      <SummaryCard label="Old regime" result={comparison.old} active={recommended === "old"} />
      <SummaryCard label="New regime" result={comparison.new} active={recommended === "new"} />

      <section className="review-box">
        <h3>Review checklist</h3>
        <ul>
          <li>Verify AIS, TIS and Form 26AS totals against entered line items.</li>
          <li>{hasCapitalGains ? "Capital gains detected: review Schedule CG and loss set-off." : "No material capital gains entered yet."}</li>
          <li>{hasForeign ? "Foreign income/assets detected: review Schedule FA, FSI, TR and Form 67." : "No foreign income disclosure trigger from current rows."}</li>
          <li>Interest under 234A/B/C is not auto-computed in this first version.</li>
        </ul>
      </section>
      <TaxSavingIdeas suggestions={suggestions} recommended={recommended} />
    </aside>
  );
}

function StatStrip({ comparison }) {
  const result = comparison[comparison.recommended];
  return (
    <div className="stat-strip">
      <div>
        <span>Recommended</span>
        <strong>{comparison.recommended === "old" ? "Old regime" : "New regime"}</strong>
      </div>
      <div>
        <span>Gross total income</span>
        <strong>{money(result.grossTotalIncome)}</strong>
      </div>
      <div>
        <span>Tax after cess</span>
        <strong>{money(result.totalTax)}</strong>
      </div>
      <div>
        <span>Taxes paid</span>
        <strong>{money(result.taxesPaid)}</strong>
      </div>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState("profile");
  const [data, setData] = useState(initialData);
  const comparison = useMemo(() => compareRegimes(data), [data]);
  const suggestions = useMemo(() => getTaxSavingSuggestions(data), [data]);
  const ruleYear = useMemo(() => getRuleYear(data.profile.taxYearId), [data.profile.taxYearId]);

  const updateProfile = (key, value) => {
    setData((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  };

  const updateRow = (keyName, rowId, field, value) => {
    setData((current) => ({
      ...current,
      [keyName]: current[keyName].map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    }));
  };

  const addRow = (keyName, kind) => {
    setData((current) => ({ ...current, [keyName]: [...current[keyName], blankRow(kind)] }));
  };

  const removeRow = (keyName, rowId) => {
    setData((current) => ({ ...current, [keyName]: current[keyName].filter((row) => row.id !== rowId) }));
  };

  return (
    <main className="app-shell">
      <nav className="side-nav" aria-label="Tax sections">
        <div className="brand">
          <Banknote size={22} />
          <span>TaxDesk India</span>
        </div>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              className={activeSection === section.id ? "active" : ""}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              <Icon size={18} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </nav>

      <section className="main-column">
        <header className="topbar">
          <div>
            <h1>Indian Income Tax Calculator</h1>
            <p>Old vs new regime, line-item income capture, and disclosure review.</p>
          </div>
          <div className="year-select">
            <Building2 size={16} />
            <span>{ruleYear.shortLabel}</span>
          </div>
        </header>

        <StatStrip comparison={comparison} />

        <div className="workspace">
          <div className="editor-column">
            {activeSection === "profile" && <ProfilePanel data={data} updateProfile={updateProfile} />}
            {activeSection !== "profile" &&
              sectionRows[activeSection].map((group) => (
                <LineTable
                  key={group.keyName}
                  title={group.title}
                  description={group.description}
                  rows={data[group.keyName]}
                  fields={fieldMeta[group.keyName]}
                  onChange={(rowId, field, value) => updateRow(group.keyName, rowId, field, value)}
                  onAdd={() => addRow(group.keyName, group.kind)}
                  onRemove={(rowId) => removeRow(group.keyName, rowId)}
                />
              ))}
          </div>
          <SummaryPanel comparison={comparison} suggestions={suggestions} ruleYear={ruleYear} />
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
