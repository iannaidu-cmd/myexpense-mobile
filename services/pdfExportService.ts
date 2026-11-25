// ─── PDF Export Service ───────────────────────────────────────────────────────
// Builds the ITR12 preparation summary PDF and opens the native share sheet.
// Uses expo-print to render HTML → PDF, and expo-sharing to share the file.
//
// The report follows the ITR12 "Local Business, Trade and Professional Income"
// section: SARS field labels, in form order, one whole-rand amount per field,
// so the user can work straight down the eFiling page. Every figure comes from
// the signed-in user's own records (lib/itr12Summary.ts does the sums).
// ─────────────────────────────────────────────────────────────────────────────

import {
  annualMedicalContributions,
  isMedicalCategory,
  MEDICAL_CATEGORY,
  MEDICAL_TYPES,
  medicalTotals,
  validSarsField,
  assessmentPeriod,
  buildExpenditure,
  buildIncome,
  businessResult,
  canonicalCategory,
  filingChecks,
  maskCardNumbers,
  sarsFieldFor,
  yearOfAssessment,
  type FilingCheck,
} from "@/lib/itr12Summary";
import { workTypeLabel } from "@/lib/workType";
import { expenseService, type HomeOfficeSetupClaim } from "@/services/expenseService";
import { loadVehicleLogbook } from "@/services/vehicleLogbookService";
import type { VehicleLogbook } from "@/lib/vehicleClaim";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { taxLiabilityService } from "@/services/taxLiabilityService";
import { colour } from "@/tokens";
import type { Expense, TaxLiabilityEstimate } from "@/types/database";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// User text (OCR vendor names, profile fields) goes into HTML, so escape it —
// a stray "<" in a vendor name would otherwise break or drop part of the PDF.
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// ─── PDF CSS palette ──────────────────────────────────────────────────────────
// Neutral cards and borders; periwinkle only for the brand header and accents.
const CSS = {
  primary: colour.primary,
  white: colour.white,
  text: colour.text,
  textMid: colour.textMid,
  textSub: colour.textSub,
  border: colour.border,
  borderLight: colour.borderLight,
  cardBg: colour.surface1,
  noir: colour.noir,
  onNoir: colour.onNoir,
  onNoir2: colour.onNoir2,
  success: colour.success,
  danger: colour.danger,
  warning: colour.warning,
  warningBg: colour.warningBg,
};

// ─── Formatting helpers ───────────────────────────────────────────────────────

const fmtZAR = (n: number) =>
  `R&nbsp;${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Whole rands, the way eFiling takes them. */
const fmtRands = (n: number) => `R&nbsp;${Math.round(n).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

function checkText(c: FilingCheck): string {
  if (c.kind === "logbookIncomplete") {
    return `<strong>Vehicle costs not claimed yet:</strong> ${fmtZAR(c.amount)} from ${c.count} ${c.count === 1 ? "expense" : "expenses"}. You claim the share of your driving that was for work, from your mileage logbook. Add your vehicle's opening and closing odometer readings for the tax year so this can be worked out.`;
  }
  const what = `${esc(c.vendor)}, ${fmtDate(c.date)}, ${fmtZAR(c.amount)}`;
  switch (c.kind) {
    case "duplicate":
      return `<strong>Possible duplicate:</strong> ${what} is logged ${c.count} times. Delete the extra ${c.count === 2 ? "entry" : "entries"} if it was one purchase.`;
    case "largeEquipment":
      return `<strong>Equipment of R7&nbsp;000 or more:</strong> ${what}. SARS lets you claim items under R7&nbsp;000 in full in the year you buy them. Dearer items are claimed over several years, so this year's amount should be smaller.`;
    case "supermarketEntertainment":
      return `<strong>Supermarket under Entertainment:</strong> ${what}. Only claim it if it was for business entertaining, not personal groceries.`;
    case "bondInterest":
      return `<strong>Home bond interest:</strong> ${what}. SARS hasn't allowed bond interest since the 2023 tax year. Mark it as personal before you file.`;
    case "phoneShareNotSet":
      return `<strong>Phone cost with no work share:</strong> ${what}. It's claimed in full for now. Open the expense and enter the work use % so only the work part is claimed.`;
    case "typeNotChosen":
      return `<strong>${esc(c.category)} with no type:</strong> ${what}. It's under ${esc(c.field)} for now. Open the expense and choose its type so it goes in the right ITR12 field.`;
  }
}

// ─── HTML template ────────────────────────────────────────────────────────────

interface BuildOpts {
  profile: {
    full_name: string | null;
    tax_number: string | null;
    work_type: string | null;
    vat_registered: boolean;
    vat_number: string | null;
    medical_aid_monthly?: number | null;
    medical_aid_dependants?: number | null;
  };
  taxYear: string;
  expenses: Expense[];
  income: { amount: number; vat_amount?: number | null; source: string; category: string | null; recoupment_vehicle_id?: string | null }[];
  homeOfficeSetup: HomeOfficeSetupClaim | null;
  includeVAT: boolean;
  includePersonal: boolean;
  summaryOnly: boolean;
  taxLiabilityEstimate: TaxLiabilityEstimate | null;
  /** Vehicle running costs claim this logbook share (lib/vehicleClaim.ts). */
  logbook?: VehicleLogbook;
}

export function buildITR12HTML(opts: BuildOpts): string {
  const { profile, taxYear, expenses, homeOfficeSetup, includeVAT, includePersonal, summaryOnly, taxLiabilityEstimate } = opts;
  const vatRegistered = profile.vat_registered;

  const expenditure = buildExpenditure(expenses, vatRegistered, homeOfficeSetup?.amount ?? 0, opts.logbook);
  const income = buildIncome(opts.income);
  const result = businessResult(income, expenditure);
  const checks = filingChecks(expenses, opts.logbook);
  const yoa = yearOfAssessment(taxYear);
  const period = assessmentPeriod(taxYear);

  const generatedDate = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  const blank = `<span class="blank">Leave blank</span>`;
  const row = (label: string, value: string, note = "") =>
    `<tr><td>${label}${note ? `<div class="note">${note}</div>` : ""}</td><td class="num">${value}</td></tr>`;

  // ── Income ──
  const elsewhere: string[] = [];
  if (income.employment > 0) {
    elsewhere.push(`Employment income of ${fmtZAR(income.employment)} goes on your IRP5/IT3(a) certificates, which SARS fills in for you.`);
  }
  if (income.otherSection > 0) {
    const parts = Object.entries(income.otherSectionBySource).map(([src, amt]) => `${esc(src)} ${fmtZAR(amt)}`);
    elsewhere.push(`Other income (${parts.join(", ")}) is declared in its own section of the ITR12, not here.`);
  }
  const incomeHTML = `
    <div class="section-title">Income</div>
    <table>
      <thead><tr><th>ITR12 field</th><th class="num">Enter in eFiling</th></tr></thead>
      <tbody>
        ${row("Turnover / Sales", result.turnoverRands > 0 ? fmtRands(result.turnoverRands) : blank, vatRegistered ? "Business income you logged in MyExpense, without the VAT you charged" : "Business income you logged in MyExpense")}
        ${row("Cost of Sales", blank, "Only if you buy stock to resell")}
        ${row("Gross Profit", result.grossProfitRands > 0 ? fmtRands(result.grossProfitRands) : blank)}
        <tr class="total-row"><td>Total</td><td class="num">${fmtRands(result.grossProfitRands)}</td></tr>
      </tbody>
    </table>
    ${elsewhere.length ? `<div class="aside">${elsewhere.join(" ")}</div>` : ""}`;

  // ── Expenditure ──
  const expenditureRows = expenditure.rows
    .map((r) => {
      const detail = r.categories
        .map((c) => {
          const n = c.fromSetup ? "from your home office setup" : `${c.count} ${c.count === 1 ? "item" : "items"}`;
          return `${esc(c.category)} (${n}) ${fmtZAR(c.amount)}`;
        })
        .join("<br>");
      const otherDesc =
        r.field === "Other" && expenditure.otherDescription
          ? `<div class="desc-other">Description relating to other: <strong>${esc(expenditure.otherDescription)}</strong></div>`
          : "";
      return `
        <tr>
          <td class="field">${esc(r.field)}${otherDesc}</td>
          <td class="detail">${detail}</td>
          <td class="num enter">${fmtRands(r.rands)}</td>
        </tr>`;
    })
    .join("");

  const setupNote =
    homeOfficeSetup && homeOfficeSetup.amount > 0 && homeOfficeSetup.description
      ? `<div class="aside">${esc(homeOfficeSetup.description)}.</div>`
      : "";

  const expenditureHTML = `
    <div class="section-title">Expenditure${vatRegistered ? " (excluding VAT you claim back)" : ""}</div>
    <table>
      <thead><tr><th>ITR12 field</th><th>Made up of</th><th class="num">Enter in eFiling</th></tr></thead>
      <tbody>
        ${expenditureRows || `<tr><td colspan="3" class="blank">No claimable business expenses logged for this year.</td></tr>`}
        <tr class="total-row"><td>Total</td><td></td><td class="num">${fmtRands(expenditure.totalRands)}</td></tr>
      </tbody>
    </table>
    <div class="aside">Leave any expenditure field not listed here blank. Each field is rounded to whole rands, so the total can differ from the exact amount (${fmtZAR(expenditure.total)}) by a few rand.</div>
    ${setupNote}`;

  // ── Profit or loss ──
  const accountingLabel = result.accountingRands >= 0 ? "Accounting Profit" : "Accounting Loss";
  const taxableLabel = result.taxableRands >= 0 ? "Taxable Profit" : "Taxable Loss";
  const profitHTML = `
    <div class="section-title">Profit or loss</div>
    <table>
      <thead><tr><th>ITR12 field</th><th class="num">Enter in eFiling</th></tr></thead>
      <tbody>
        ${row(accountingLabel, fmtRands(Math.abs(result.accountingRands)), "Gross Profit minus total expenditure")}
        ${result.recoupmentRands > 0 ? row("Adjustments: Add Back – Recoupment", fmtRands(result.recoupmentRands), "From selling a vehicle you claimed wear and tear on") : ""}
        <tr class="total-row"><td>${taxableLabel}</td><td class="num">${fmtRands(Math.abs(result.taxableRands))}</td></tr>
      </tbody>
    </table>`;

  // ── Retirement annuity (its own ITR12 section) ──
  const raHTML =
    expenditure.retirementAnnuity.amount > 0
      ? `
    <div class="section-title">Retirement annuity fund contributions</div>
    <table>
      <thead><tr><th>ITR12 field</th><th class="num">Enter in eFiling</th></tr></thead>
      <tbody>
        ${row("Total contributions for this year of assessment (4006)", fmtRands(expenditure.retirementAnnuity.amount), `${expenditure.retirementAnnuity.count} ${expenditure.retirementAnnuity.count === 1 ? "payment" : "payments"} logged. Use your fund's tax certificate if the amounts differ.`)}
      </tbody>
    </table>`
      : "";

  // ── Medical (its own ITR12 section, a tax credit not a deduction) ──
  const med = medicalTotals(expenses);
  const medContrib = annualMedicalContributions(med, profile.medical_aid_monthly);
  const medicalHTML =
    medContrib > 0 || med.claimedNotPaid > 0 || med.notClaimed > 0
      ? `
    <div class="section-title">Medical</div>
    <div class="aside">Medical costs aren't a business expense. They go in the medical section of your ITR12, where SARS gives you a tax credit for them.</div>
    <table>
      <thead><tr><th>ITR12 field</th><th class="num">Enter in eFiling</th></tr></thead>
      <tbody>
        ${medContrib > 0 ? row("Total number of dependants (including yourself) per month", String(1 + Math.max(0, Number(profile.medical_aid_dependants ?? 0))), "Everyone on your medical aid") : ""}
        ${medContrib > 0 ? row("Total medical contributions made by yourself (4005)", fmtRands(medContrib), med.contributions > 0 ? "From the medical aid payments you logged. Use your medical aid's tax certificate if it differs." : `Your monthly amount in the Tax Liability calculator x 12. Use your medical aid's tax certificate if it differs.`) : ""}
        ${med.claimedNotPaid > 0 ? row("Medical expenses claimed from your medical scheme and not paid back (4020)", fmtRands(med.claimedNotPaid), "Should match \"claims not recovered\" on your medical aid's tax certificate") : ""}
        ${med.notClaimed > 0 ? row("Qualifying medical expenses not claimed from your medical scheme (4034)", fmtRands(med.notClaimed), "Keep the receipts in case SARS asks") : ""}
      </tbody>
    </table>`
      : "";

  // ── Checks before filing ──
  const checksHTML = checks.length
    ? `
    <div class="section-title">Check these before you file</div>
    <ul class="checks">${checks.map((c) => `<li>${checkText(c)}</li>`).join("")}</ul>`
    : "";

  // ── Estimate (dark card) ──
  const estimateHTML = taxLiabilityEstimate
    ? (() => {
        const liability = taxLiabilityEstimate.final_liability;
        const label = liability > 0 ? "Estimated amount owing to SARS" : liability < 0 ? "Estimated refund" : "Nothing owing and no refund";
        const extras: string[] = [];
        if (Number(taxLiabilityEstimate.other_taxable_income) > 0) extras.push(`adds other income of ${fmtZAR(taxLiabilityEstimate.other_taxable_income)}`);
        if (Number(taxLiabilityEstimate.retirement_annuity_contributions) > 0) extras.push(`takes off retirement annuity contributions of up to ${fmtZAR(taxLiabilityEstimate.retirement_annuity_contributions)}`);
        const how = extras.length ? `It ${extras.join(" and ")}, so it won't match the Taxable Profit above. ` : "";
        return `
    <div class="estimate">
      <div>
        <div class="estimate-label">${label}</div>
        <div class="estimate-sub">From your Tax Liability calculator, last worked out ${fmtDate(taxLiabilityEstimate.last_calculated_at)}, on taxable income of ${fmtZAR(taxLiabilityEstimate.taxable_income)}. ${how}If you've added income or expenses since then, open the calculator so it updates.</div>
      </div>
      <div class="estimate-amount" style="color:${liability > 0 ? CSS.danger : CSS.onNoir}">${fmtZAR(Math.abs(liability))}</div>
    </div>`;
      })()
    : "";

  // ── Overview cards ──
  const overviewHTML = `
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">Business income</div>
        <div class="kpi-value">${fmtZAR(income.turnover)}</div>
        <div class="kpi-sub">Turnover / Sales</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Claimable business expenses</div>
        <div class="kpi-value" style="color:${CSS.success}">${fmtZAR(expenditure.total)}</div>
        <div class="kpi-sub">Total expenditure</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Personal spending</div>
        <div class="kpi-value" style="color:${CSS.textSub}">${fmtZAR(expenditure.notClaimable.amount)}</div>
        <div class="kpi-sub">${expenditure.notClaimable.count} ${expenditure.notClaimable.count === 1 ? "item" : "items"} logged, not claimed</div>
      </div>
    </div>`;

  const vatHTML = includeVAT
    ? (() => {
        const totalVAT = expenses.reduce((s, e) => s + Number(e.vat_amount ?? 0), 0);
        return `<div class="aside">VAT on your logged expenses: ${fmtZAR(totalVAT)}. ${
          vatRegistered
            ? "You claim this back on your VAT201, so it's left out of the expenditure above."
            : "You're not registered for VAT, so it can't be claimed back and is included in the expenditure above."
        }</div>`;
      })()
    : "";

  // ── Line items ──
  const lineItemsHTML = summaryOnly
    ? ""
    : (() => {
        const rows = expenses
          .filter((e) => e.is_deductible || includePersonal || isMedicalCategory(e.category))
          .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
        if (rows.length === 0 && !homeOfficeSetup) return "";

        const setupTr = homeOfficeSetup
          ? `
          <tr>
            <td>${esc(yoa)}</td>
            <td>${esc(homeOfficeSetup.description ?? "Home office setup")}</td>
            <td>Home Office</td>
            <td>Rental Paid</td>
            <td class="num">${fmtZAR(homeOfficeSetup.amount)}</td>
            ${includeVAT ? `<td class="num">—</td>` : ""}
            <td class="c">✓</td>
          </tr>`
          : "";

        const trs = rows
          .map((e) => {
            const field = e.is_deductible ? sarsFieldFor(e) : null;
            const cat = canonicalCategory(e.category);
            const medical = isMedicalCategory(cat);
            const medCode = medical ? validSarsField(MEDICAL_CATEGORY, e.sars_field) ?? MEDICAL_TYPES[0].field : null;
            return `
          <tr>
            <td>${fmtDate(e.expense_date)}</td>
            <td>${esc(maskCardNumbers(e.vendor))}</td>
            <td>${esc(cat)}</td>
            <td>${medCode ? `Medical (${medCode})` : field ? esc(field) : e.is_deductible && cat === "Retirement Annuity" ? "Retirement annuity (4006)" : "—"}</td>
            <td class="num">${fmtZAR(e.amount)}</td>
            ${includeVAT ? `<td class="num">${e.vat_amount ? fmtZAR(e.vat_amount) : "—"}</td>` : ""}
            <td class="c">${e.is_deductible || medical ? "✓" : "✗"}</td>
          </tr>`;
          })
          .join("");

        return `
          <div class="section-title">Line items</div>
          <table class="lines">
            <thead>
              <tr>
                <th>Date</th><th>Vendor</th><th>Category</th><th>ITR12 field</th><th class="num">Amount</th>
                ${includeVAT ? `<th class="num">VAT</th>` : ""}
                <th class="c">Claimed</th>
              </tr>
            </thead>
            <tbody>${setupTr}${trs}</tbody>
          </table>`;
      })();

  const vatStatus = vatRegistered ? `Registered${profile.vat_number ? ` (${esc(profile.vat_number)})` : ""}` : "Not registered";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyExpense ITR12 preparation summary, year of assessment ${esc(yoa)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: ${CSS.text}; background: ${CSS.white}; }
    .header { background: ${CSS.primary}; color: ${CSS.white}; padding: 26px 32px 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-logo { font-size: 22pt; font-weight: 900; letter-spacing: -0.5px; }
    .header-meta { text-align: right; font-size: 9pt; line-height: 1.6; }
    .header-meta strong { font-size: 12pt; display: block; }
    .taxpayer-bar { background: ${CSS.white}; border-bottom: 1px solid ${CSS.border}; padding: 14px 32px; display: flex; gap: 36px; flex-wrap: wrap; }
    .taxpayer-label { font-size: 8pt; color: ${CSS.textSub}; }
    .taxpayer-value { font-size: 11pt; font-weight: 700; }
    .content { padding: 20px 32px 24px; }
    .intro { font-size: 9.5pt; color: ${CSS.textMid}; line-height: 1.5; margin-bottom: 16px; }
    .kpi-row { display: flex; gap: 12px; margin-bottom: 18px; }
    .kpi-card { flex: 1; border: 1px solid ${CSS.borderLight}; border-radius: 10px; padding: 12px 14px; background: ${CSS.cardBg}; }
    .kpi-label { font-size: 8.5pt; color: ${CSS.textSub}; margin-bottom: 4px; }
    .kpi-value { font-size: 14pt; font-weight: 800; color: ${CSS.text}; margin-bottom: 2px; }
    .kpi-sub { font-size: 8pt; color: ${CSS.textSub}; }
    .estimate { background: ${CSS.noir}; color: ${CSS.onNoir}; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 20px 0 6px; }
    .estimate-label { font-size: 10.5pt; font-weight: 700; margin-bottom: 4px; }
    .estimate-sub { font-size: 8pt; color: ${CSS.onNoir2}; line-height: 1.45; }
    .estimate-amount { font-size: 19pt; font-weight: 900; white-space: nowrap; }
    .section-title { font-size: 12pt; font-weight: 700; color: ${CSS.text}; border-bottom: 2px solid ${CSS.primary}; padding-bottom: 5px; margin: 22px 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8px; }
    th { padding: 7px 10px; font-size: 8.5pt; font-weight: 700; color: ${CSS.textSub}; border-bottom: 1px solid ${CSS.border}; text-align: left; background: ${CSS.white}; }
    td { padding: 8px 10px; border-bottom: 1px solid ${CSS.borderLight}; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    .c { text-align: center; }
    td.field { font-weight: 600; width: 34%; }
    td.detail { color: ${CSS.textMid}; font-size: 8.5pt; line-height: 1.45; }
    td.enter { font-weight: 800; font-size: 10pt; }
    .note { font-size: 8pt; color: ${CSS.textSub}; font-weight: 400; margin-top: 2px; }
    .desc-other { font-size: 8pt; font-weight: 400; color: ${CSS.textMid}; margin-top: 4px; }
    .blank { color: ${CSS.textSub}; font-style: italic; font-weight: 400; }
    .total-row td { font-weight: 800; border-top: 2px solid ${CSS.text}; border-bottom: none; }
    .aside { font-size: 8.5pt; color: ${CSS.textSub}; line-height: 1.5; margin: 4px 0 8px; }
    .checks { padding-left: 18px; font-size: 9pt; line-height: 1.5; }
    .checks li { margin-bottom: 6px; }
    table.lines td { font-size: 8.5pt; }
    .disclaimer { background: ${CSS.warningBg}; border: 1px solid ${CSS.warning}; border-radius: 8px; padding: 12px 16px; font-size: 8.5pt; color: ${CSS.textMid}; margin-top: 24px; line-height: 1.5; }
    .footer { margin-top: 24px; border-top: 1px solid ${CSS.borderLight}; padding-top: 12px; text-align: center; font-size: 8pt; color: ${CSS.textSub}; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="header-logo">MyExpense</div>
      <div style="font-size:9pt;margin-top:3px">South African Tax Expense Manager</div>
    </div>
    <div class="header-meta">
      <strong>ITR12 preparation summary</strong>
      Year of Assessment ${esc(yoa)}<br>
      ${esc(period)}<br>
      Generated ${generatedDate}
    </div>
  </div>

  <div class="taxpayer-bar">
    <div><div class="taxpayer-label">Taxpayer</div><div class="taxpayer-value">${esc(profile.full_name || "—")}</div></div>
    <div><div class="taxpayer-label">Taxpayer Ref</div><div class="taxpayer-value">${esc(profile.tax_number || "Not added yet")}</div></div>
    <div><div class="taxpayer-label">Return</div><div class="taxpayer-value">ITR12</div></div>
    <div><div class="taxpayer-label">Work type</div><div class="taxpayer-value">${esc(workTypeLabel(profile.work_type))}</div></div>
    <div><div class="taxpayer-label">VAT</div><div class="taxpayer-value">${vatStatus}</div></div>
  </div>

  <div class="content">
    <div class="intro">On eFiling, open the <strong>Local Business, Trade and Professional Income</strong> section of your ITR12 and copy each amount below into the box with the same name. eFiling only takes whole rands, so the amounts to enter have no cents.</div>

    ${overviewHTML}
    ${incomeHTML}
    ${expenditureHTML}
    ${vatHTML}
    ${profitHTML}
    ${raHTML}
    ${medicalHTML}
    ${estimateHTML}
    ${checksHTML}
    ${lineItemsHTML}

    <div class="disclaimer">
      <strong>Please note:</strong> MyExpense made this summary from your own records to help you fill in your ITR12. It is not a SARS document and it has not been sent to SARS. Check each figure before you file. SARS works out your final tax${taxLiabilityEstimate ? ", so the estimate above is a guide only" : ""}. If your tax affairs are complicated, ask a registered tax practitioner to check it.
    </div>

    <div class="footer">
      MyExpense · myexpense.co.za<br>
      Generated ${generatedDate} · Year of Assessment ${esc(yoa)} · Confidential
    </div>
  </div>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PDFExportOptions {
  userId: string;
  taxYear: string;
  includeVAT?: boolean;
  includePersonal?: boolean;
  summaryOnly?: boolean;
}

export async function generateITR12PDF(opts: PDFExportOptions): Promise<void> {
  const { userId, taxYear, includeVAT = false, includePersonal = false, summaryOnly = false } = opts;

  // The tax liability estimate is optional (most users won't have filled in
  // the calculator) — a fetch failure there shouldn't block the export.
  const [profile, expenses, income, taxLiabilityEstimate, setupClaim, logbook] = await Promise.all([
    profileService.getProfile(userId),
    expenseService.getExpenses(userId, taxYear),
    incomeService.getIncome(userId, taxYear),
    taxLiabilityService.getEstimate(userId, taxYear).catch(() => null),
    expenseService.getHomeOfficeSetupClaim(userId, taxYear),
    loadVehicleLogbook(userId, taxYear),
  ]);

  const html = buildITR12HTML({
    profile: {
      full_name: profile?.full_name ?? null,
      tax_number: profile?.tax_number ?? null,
      work_type: profile?.work_type ?? null,
      vat_registered: profile?.vat_registered ?? false,
      vat_number: profile?.vat_number ?? null,
      medical_aid_monthly: profile?.medical_aid_monthly ?? null,
      medical_aid_dependants: profile?.medical_aid_dependants ?? 0,
    },
    taxYear,
    expenses,
    income,
    homeOfficeSetup: setupClaim.amount > 0 ? setupClaim : null,
    includeVAT,
    includePersonal,
    summaryOnly,
    taxLiabilityEstimate,
    logbook,
  });

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device. Please use a physical device.");
  }
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `MyExpense ITR12 ${taxYear}`,
    UTI: "com.adobe.pdf",
  });
}
