// ─── PDF Export Service ───────────────────────────────────────────────────────
// Generates a professional ITR12 PDF report and triggers the native share sheet.
// Uses expo-print to render HTML → PDF, and expo-sharing to share the file.
// ─────────────────────────────────────────────────────────────────────────────

import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import type { Expense } from "@/types/database";
import { ITR12_CATEGORIES } from "@/types/database";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// ─── Formatting helpers ───────────────────────────────────────────────────────

const fmtZAR = (n: number) =>
  `R&nbsp;${Number(n).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── ITR12 code lookup ────────────────────────────────────────────────────────

function getITR12Code(category: string, itr12_code?: string | null): string {
  if (itr12_code) return itr12_code;
  return ITR12_CATEGORIES[category]?.code ?? "4011";
}

// ─── HTML template ────────────────────────────────────────────────────────────

function buildHTML(opts: {
  profile: {
    full_name: string | null;
    tax_number: string | null;
    work_type: string | null;
  };
  taxYear: string;
  totalIncome: number;
  totalExpenses: number;
  totalDeductions: number;
  totalVAT: number;
  categoryBreakdown: Record<
    string,
    { amount: number; code: string; count: number }
  >;
  expenses: Expense[];
  includeReceipts: boolean;
  includeVAT: boolean;
  includePersonal: boolean;
  summaryOnly: boolean;
}): string {
  const {
    profile,
    taxYear,
    totalIncome,
    totalExpenses,
    totalDeductions,
    totalVAT,
    categoryBreakdown,
    expenses,
    includeVAT,
    includePersonal,
    summaryOnly,
  } = opts;

  const estTaxSaving = Math.round(totalDeductions * 0.31);
  const generatedDate = new Date().toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const deductionRows = Object.entries(categoryBreakdown)
    .filter(([k]) => k !== "Personal / Non-deductible")
    .sort(([, a], [, b]) => b.amount - a.amount);

  const personalRows = Object.entries(categoryBreakdown).filter(
    ([k]) => k === "Personal / Non-deductible",
  );

  // Line item rows grouped by category
  const lineItemsHTML = summaryOnly
    ? ""
    : (() => {
        const deductible = expenses.filter((e) => e.is_deductible);
        const personal = includePersonal
          ? expenses.filter((e) => !e.is_deductible)
          : [];
        const rows = [...deductible, ...personal].sort(
          (a, b) =>
            new Date(b.expense_date).getTime() -
            new Date(a.expense_date).getTime(),
        );

        if (rows.length === 0) return "";

        const trs = rows
          .map(
            (e) => `
          <tr>
            <td>${fmtDate(e.expense_date)}</td>
            <td>${e.vendor}</td>
            <td>${e.category}</td>
            <td style="text-align:center">${getITR12Code(e.category, e.itr12_code)}</td>
            <td style="text-align:right">${fmtZAR(e.amount)}</td>
            ${includeVAT ? `<td style="text-align:right">${e.vat_amount ? fmtZAR(e.vat_amount) : "—"}</td>` : ""}
            <td style="text-align:center">${e.is_deductible ? "✓" : "✗"}</td>
          </tr>`,
          )
          .join("\n");

        return `
          <div class="section-title">LINE ITEMS</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Category</th>
                <th style="text-align:center">ITR12</th>
                <th style="text-align:right">Amount</th>
                ${includeVAT ? '<th style="text-align:right">VAT</th>' : ""}
                <th style="text-align:center">Deductible</th>
              </tr>
            </thead>
            <tbody>${trs}</tbody>
          </table>`;
      })();

  const categoryRowsHTML = deductionRows
    .map(
      ([cat, { amount, code, count }]) => `
      <tr>
        <td>${cat}</td>
        <td style="text-align:center">${code}</td>
        <td style="text-align:center">${count}</td>
        <td style="text-align:right">${fmtZAR(amount)}</td>
      </tr>`,
    )
    .join("\n");

  const personalRowsHTML =
    includePersonal && personalRows.length > 0
      ? personalRows
          .map(
            ([cat, { amount, count }]) => `
          <tr style="color:#999">
            <td>${cat}</td>
            <td style="text-align:center">—</td>
            <td style="text-align:center">${count}</td>
            <td style="text-align:right">${fmtZAR(amount)}</td>
          </tr>`,
          )
          .join("\n")
      : "";

  const vatSection = includeVAT
    ? `<div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">Total VAT (Input Tax)</div>
          <div class="kpi-value" style="color:#0066cc">${fmtZAR(totalVAT)}</div>
          <div class="kpi-sub">Potential VAT refund where registered</div>
        </div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyExpense ITR12 Report — ${taxYear}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      color: #1a1a2e;
      background: #fff;
    }
    .header {
      background: #006FFD;
      color: #fff;
      padding: 28px 32px 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-logo {
      font-size: 22pt;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .header-logo span { color: #7DD3FC; }
    .header-meta { text-align: right; font-size: 9pt; line-height: 1.6; opacity: 0.9; }
    .header-meta strong { font-size: 11pt; display: block; }
    .taxpayer-bar {
      background: #F0F7FF;
      border-bottom: 2px solid #E0ECFF;
      padding: 14px 32px;
      display: flex;
      gap: 40px;
      align-items: center;
    }
    .taxpayer-field { }
    .taxpayer-label { font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .taxpayer-value { font-size: 11pt; font-weight: 700; color: #1a1a2e; }
    .content { padding: 24px 32px; }
    .kpi-row {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      flex: 1;
      border: 1.5px solid #E0ECFF;
      border-radius: 10px;
      padding: 14px 16px;
      background: #FAFCFF;
    }
    .kpi-label {
      font-size: 8pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 15pt;
      font-weight: 800;
      color: #006FFD;
      margin-bottom: 2px;
    }
    .kpi-sub { font-size: 8pt; color: #aaa; }
    .saving-box {
      background: linear-gradient(135deg, #006FFD 0%, #0052CC 100%);
      color: #fff;
      border-radius: 10px;
      padding: 18px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
    }
    .saving-box-label { font-size: 10pt; opacity: 0.85; margin-bottom: 2px; }
    .saving-box-sub { font-size: 8pt; opacity: 0.65; }
    .saving-box-amount { font-size: 20pt; font-weight: 900; color: #7DD3FC; }
    .section-title {
      font-size: 8pt;
      font-weight: 700;
      color: #006FFD;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      border-bottom: 2px solid #E0ECFF;
      padding-bottom: 6px;
      margin-bottom: 12px;
      margin-top: 22px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 16px;
    }
    thead tr { background: #F0F7FF; }
    th {
      padding: 8px 10px;
      font-size: 8pt;
      font-weight: 700;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-bottom: 2px solid #E0ECFF;
      text-align: left;
    }
    td { padding: 8px 10px; border-bottom: 1px solid #F0F4FF; vertical-align: top; }
    tbody tr:last-child td { border-bottom: none; }
    .total-row td {
      font-weight: 800;
      background: #F0F7FF;
      border-top: 2px solid #006FFD;
      color: #006FFD;
    }
    .disclaimer {
      background: #FFF8E7;
      border: 1.5px solid #FFD700;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 8.5pt;
      color: #7a6000;
      margin-top: 24px;
      line-height: 1.5;
    }
    .footer {
      margin-top: 28px;
      border-top: 1px solid #E0ECFF;
      padding-top: 14px;
      text-align: center;
      font-size: 8pt;
      color: #aaa;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="header-logo">My<span>Expense</span></div>
      <div style="font-size:9pt;opacity:0.7;margin-top:3px">South African Tax Expense Manager</div>
    </div>
    <div class="header-meta">
      <strong>ITR12 INCOME TAX RETURN</strong>
      Tax Year: ${taxYear}<br>
      Generated: ${generatedDate}<br>
      Document: Official Export
    </div>
  </div>

  <!-- Taxpayer info bar -->
  <div class="taxpayer-bar">
    <div class="taxpayer-field">
      <div class="taxpayer-label">Taxpayer</div>
      <div class="taxpayer-value">${profile.full_name ?? "—"}</div>
    </div>
    <div class="taxpayer-field">
      <div class="taxpayer-label">SARS Tax Number</div>
      <div class="taxpayer-value">${profile.tax_number ?? "Not provided"}</div>
    </div>
    <div class="taxpayer-field">
      <div class="taxpayer-label">Return Type</div>
      <div class="taxpayer-value">ITR12</div>
    </div>
    <div class="taxpayer-field">
      <div class="taxpayer-label">Employment Type</div>
      <div class="taxpayer-value">${profile.work_type ?? "Sole Proprietor"}</div>
    </div>
  </div>

  <div class="content">

    <!-- KPI cards -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">Total Income</div>
        <div class="kpi-value" style="color:#0052CC">${fmtZAR(totalIncome)}</div>
        <div class="kpi-sub">All income sources, ${taxYear}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Expenses</div>
        <div class="kpi-value" style="color:#1a1a2e">${fmtZAR(totalExpenses)}</div>
        <div class="kpi-sub">All categories combined</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Deductions (S11)</div>
        <div class="kpi-value" style="color:#16a34a">${fmtZAR(totalDeductions)}</div>
        <div class="kpi-sub">Claimable under Section 11</div>
      </div>
    </div>

    <!-- VAT section -->
    ${vatSection}

    <!-- Tax saving callout -->
    <div class="saving-box">
      <div>
        <div class="saving-box-label">Estimated Tax Saving</div>
        <div class="saving-box-sub">Based on 31% marginal tax rate — consult a tax professional</div>
      </div>
      <div class="saving-box-amount">${fmtZAR(estTaxSaving)}</div>
    </div>

    <!-- Deduction breakdown by category -->
    <div class="section-title">SECTION 11 DEDUCTIONS BY CATEGORY</div>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th style="text-align:center">ITR12 Code</th>
          <th style="text-align:center">Items</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRowsHTML}
        ${personalRowsHTML}
        <tr class="total-row">
          <td>TOTAL DEDUCTIBLE EXPENSES</td>
          <td></td>
          <td></td>
          <td style="text-align:right">${fmtZAR(totalDeductions)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Line items (if not summary-only) -->
    ${lineItemsHTML}

    <!-- Disclaimer -->
    <div class="disclaimer">
      ⚠️ <strong>Important Disclaimer:</strong> This report is generated from your MyExpense records for reference purposes only. It does not constitute a submitted SARS return. Always have your ITR12 reviewed and submitted by a registered tax practitioner. Estimated tax savings are indicative only and based on a 31% marginal rate.
    </div>

    <div class="footer">
      MyExpense · South African Tax Expense Manager · myexpense.co.za<br>
      Generated on ${generatedDate} · Tax Year ${taxYear} · Confidential
    </div>

  </div>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PDFExportOptions {
  userId: string;
  taxYear: string;
  includeReceipts?: boolean;
  includeVAT?: boolean;
  includeTravel?: boolean;
  includePersonal?: boolean;
  summaryOnly?: boolean;
}

export async function generateITR12PDF(opts: PDFExportOptions): Promise<void> {
  const {
    userId,
    taxYear,
    includeReceipts = true,
    includeVAT = false,
    includePersonal = false,
    summaryOnly = false,
  } = opts;

  // Fetch all data in parallel
  const [profile, expenses, incomeTotals, expenseTotals, byCategory] =
    await Promise.all([
      profileService.getProfile(userId),
      expenseService.getExpenses(userId, taxYear),
      incomeService.getTotals(userId),
      expenseService.getTotals(userId, taxYear),
      expenseService.getByCategory(userId, taxYear),
    ]);

  // Build category breakdown with code + count
  const categoryBreakdown: Record<
    string,
    { amount: number; code: string; count: number }
  > = {};

  for (const expense of expenses) {
    const key = expense.category;
    if (!categoryBreakdown[key]) {
      categoryBreakdown[key] = {
        amount: 0,
        code: getITR12Code(expense.category, expense.itr12_code),
        count: 0,
      };
    }
    categoryBreakdown[key].amount += Number(expense.amount);
    categoryBreakdown[key].count += 1;
  }

  // Total VAT
  const totalVAT = expenses.reduce(
    (sum, e) => sum + Number(e.vat_amount ?? 0),
    0,
  );

  const html = buildHTML({
    profile: {
      full_name: profile?.full_name ?? null,
      tax_number: profile?.tax_number ?? null,
      work_type: profile?.work_type ?? null,
    },
    taxYear,
    totalIncome: incomeTotals.totalIncome,
    totalExpenses: expenseTotals.totalExpenses,
    totalDeductions: expenseTotals.totalDeductions,
    totalVAT,
    categoryBreakdown,
    expenses,
    includeReceipts,
    includeVAT,
    includePersonal,
    summaryOnly,
  });

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `MyExpense ITR12 ${taxYear}`,
      UTI: "com.adobe.pdf",
    });
  } else {
    throw new Error(
      "Sharing is not available on this device. Please use a physical device.",
    );
  }
}
