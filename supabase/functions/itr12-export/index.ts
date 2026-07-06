// supabase/functions/itr12-export/index.ts
// Generates a formatted ITR12 eFiling reference workbook for the authenticated user.
// Deploy: npx supabase functions deploy itr12-export

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

// ── Constants ─────────────────────────────────────────────────────────────────

// R/km — 2026/27 tax year (effective 1 March 2026). Was previously R4.84,
// which was actually the correct 2024/25 figure left stale after the label
// next to it was bumped forward without updating the number. This function
// isn't currently invoked from the client (see services/pdfExportService.ts
// for the live ITR12 export path) but keep it correct in case it's revived.
const SARS_MILEAGE_RATE = 4.95;
const ENTERTAINMENT_CAP = 0.8;  // s23(o) — 80% deductible
const RA_CAP_RATE       = 0.275; // 27.5% of gross income
const RA_CAP_MAX        = 350000; // R350,000 per annum

// Colours matching SARS ITR12 PDF
const SARS_BLUE  = "1F3864";
const SARS_MID   = "2E5DA6";
const SARS_RED   = "C00000";
const WHITE      = "FFFFFF";
const INPUT_FILL = "FFF2CC";

// ── CORS headers ──────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ITR12Data {
  meta: {
    tax_year:     string;
    generated_at: string;
    mileage_rate: number;
    currency:     string;
  };
  taxpayer: {
    full_name:     string;
    business_name: string;
    tax_number:    string;
    work_type:     string;
  };
  income: {
    total:     number;
    by_source: Record<string, number>;
  };
  expenses: {
    // keyed by the exact ITR12 Local Business expenditure field name (Pg 11-12)
    by_field: Record<string, number>;
    ra_contributions: number; // code 4006 – Pg 23
    meals_entertainment: {
      gross:      number;
      deductible: number;
    };
    non_deductible_total: number;
    itr12_readiness_pct:  number;
  };
  mileage: {
    total_km:        number;
    deductible_km:   number;
    deductible_rand: number;
  };
  tax_estimate: {
    gross_income:      number;
    total_deductions:  number;
    taxable_income:    number;
    marginal_rate:     number;
    estimated_tax:     number;
  };
}

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchITR12Data(
  supabase: ReturnType<typeof createClient>,
  taxYear: string,
): Promise<ITR12Data> {

  const [profileRes, expensesRes, incomeRes, mileageRes] = await Promise.all([
    supabase.from("profiles").select("*").single(),
    supabase.from("expenses").select("*").eq("tax_year", taxYear),
    supabase.from("income").select("*"),
    supabase.from("mileage_trips").select("*").eq("tax_year", taxYear),
  ]);

  if (profileRes.error) throw new Error(`Profile fetch failed: ${profileRes.error.message}`);

  const profile  = profileRes.data;
  const expenses = expensesRes.data ?? [];
  const income   = incomeRes.data   ?? [];
  const mileage  = mileageRes.data  ?? [];

  // ── Income totals ──────────────────────────────────────────────────────────
  const incomeBySource: Record<string, number> = {};
  let totalIncome = 0;
  for (const row of income) {
    const source = row.source ?? "Other";
    incomeBySource[source] = (incomeBySource[source] ?? 0) + (row.amount ?? 0);
    totalIncome += row.amount ?? 0;
  }

  // ── Expense bucketing ──────────────────────────────────────────────────────
  // Maps MyExpense category -> exact ITR12 field name from the Local Business,
  // Trade and Professional Income section (pages 11-12 of the ITR12 form).
  // For sole proprietors there are no individual source codes per expenditure
  // line item; only the net taxable profit/loss carries a code (4222/4223).
  // Retirement Annuity is the only category with a standalone code (4006, Pg 23).
  const CATEGORY_MAP: Record<string, string> = {
    "Travel & Transport":       "Travel Costs – Local",
    "Home Office":              "Rental Paid",
    "Equipment & Tools":        "Depreciation",
    "Software & Subscriptions": "Other",
    "Meals & Entertainment":    "__entertainment__",
    "Entertainment":            "__entertainment__",
    "Professional Fees":        "Consulting Fees Paid",
    "Utilities":                "Electricity / Rates and Taxes",
    "Marketing & Advertising":  "Other",
    "Bank Charges":             "Bank Charges",
    "Insurance":                "Insurance",
    "Rent":                     "Rental Paid",
    "Repairs & Maintenance":    "Repairs / Maintenance",
    "Training & Education":     "Other",
    "Telephone & Cell":         "Telephone",
    "Telephone & Internet":     "Telephone",
    "Vehicle Expenses":         "Travel Costs – Local",
    "Retirement Annuity":       "__ra__",
    "Personal / Other":         "__non_deductible__",
    "Non-deductible":           "__non_deductible__",
  };

  // byField holds amounts keyed by ITR12 field name
  const byField: Record<string, number> = {};
  let entertainmentGross = 0;
  let raAmount           = 0;
  let nonDeductible      = 0;

  for (const exp of expenses) {
    const category = exp.category ?? "Personal / Other";
    const amount   = exp.amount   ?? 0;
    const field    = CATEGORY_MAP[category] ?? "Other";

    if (field === "__non_deductible__" || !exp.is_deductible) {
      nonDeductible += amount;
    } else if (field === "__entertainment__") {
      entertainmentGross += amount;
    } else if (field === "__ra__") {
      raAmount += amount;
    } else {
      byField[field] = (byField[field] ?? 0) + amount;
    }
  }

  // Apply 80% entertainment cap (s23(o)) and add to expenditure
  const entertainmentDeductible = Math.round(entertainmentGross * ENTERTAINMENT_CAP);
  if (entertainmentDeductible > 0) {
    byField["Entertainment"] = (byField["Entertainment"] ?? 0) + entertainmentDeductible;
  }

  // RA cap — 27.5% of gross income capped at R350,000
  const raCap    = Math.min(totalIncome * RA_CAP_RATE, RA_CAP_MAX);
  const raActual = Math.min(raAmount, raCap);

  // Receipt readiness
  const withReceipt  = expenses.filter((e) => e.receipt_url).length;
  const readinessPct = expenses.length > 0
    ? Math.round((withReceipt / expenses.length) * 100)
    : 0;

  // ── Mileage totals ─────────────────────────────────────────────────────────
  let totalKm      = 0;
  let deductibleKm = 0;
  for (const trip of mileage) {
    const km = Number(trip.distance_km ?? 0);
    totalKm += km;
    if (trip.is_deductible) deductibleKm += km;
  }
  const deductibleRand = Math.round(deductibleKm * SARS_MILEAGE_RATE);

  // ── Tax estimate ───────────────────────────────────────────────────────────
  const businessFieldTotal = Object.values(byField).reduce((s, v) => s + v, 0);
  const totalDeductions    = businessFieldTotal + raActual + deductibleRand;

  const taxableIncome = Math.max(0, totalIncome - totalDeductions);

  function getMarginalRate(income: number): number {
    if (income <= 237100)  return 0.18;
    if (income <= 370500)  return 0.26;
    if (income <= 512800)  return 0.31;
    if (income <= 673000)  return 0.36;
    if (income <= 857900)  return 0.39;
    if (income <= 1817000) return 0.41;
    return 0.45;
  }

  function calcTax(income: number): number {
    if (income <= 237100)  return income * 0.18;
    if (income <= 370500)  return 42678  + (income - 237100)  * 0.26;
    if (income <= 512800)  return 77362  + (income - 370500)  * 0.31;
    if (income <= 673000)  return 121475 + (income - 512800)  * 0.36;
    if (income <= 857900)  return 179147 + (income - 673000)  * 0.39;
    if (income <= 1817000) return 251258 + (income - 857900)  * 0.41;
    return 644489 + (income - 1817000) * 0.45;
  }

  const estimatedTax = Math.round(calcTax(taxableIncome));
  const marginalRate = getMarginalRate(taxableIncome);

  return {
    meta: {
      tax_year:     taxYear,
      generated_at: new Date().toISOString(),
      mileage_rate: SARS_MILEAGE_RATE,
      currency:     "ZAR",
    },
    taxpayer: {
      full_name:     profile.full_name     ?? "",
      business_name: profile.business_name ?? "",
      tax_number:    profile.tax_number    ?? "",
      work_type:     profile.work_type     ?? "sole_proprietor",
    },
    income: {
      total:     totalIncome,
      by_source: incomeBySource,
    },
    expenses: {
      by_field:         byField,
      ra_contributions: raActual,
      meals_entertainment: {
        gross:      entertainmentGross,
        deductible: entertainmentDeductible,
      },
      non_deductible_total: nonDeductible,
      itr12_readiness_pct:  readinessPct,
    },
    mileage: {
      total_km:        totalKm,
      deductible_km:   deductibleKm,
      deductible_rand: deductibleRand,
    },
    tax_estimate: {
      gross_income:     totalIncome,
      total_deductions: totalDeductions,
      taxable_income:   taxableIncome,
      marginal_rate:    marginalRate,
      estimated_tax:    estimatedTax,
    },
  };
}

// ── xlsx builder ──────────────────────────────────────────────────────────────

function buildXlsx(data: ITR12Data): Uint8Array {
  const wb = XLSX.utils.book_new();

  const R = (n: number) =>
    `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

  function hdrCell(v: string, color = SARS_BLUE): XLSX.CellObject {
    return {
      v, t: "s",
      s: {
        font:      { name: "Arial", sz: 10, bold: true, color: { rgb: WHITE } },
        fill:      { patternType: "solid", fgColor: { rgb: color } },
        alignment: { horizontal: "left", vertical: "center", wrapText: true, indent: 1 },
        border:    { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      },
    };
  }

  function labelCell(v: string, indent = 1): XLSX.CellObject {
    return {
      v, t: "s",
      s: {
        font:      { name: "Arial", sz: 9 },
        alignment: { horizontal: "left", vertical: "center", wrapText: true, indent },
        border:    { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      },
    };
  }

  function valueCell(v: string | number, highlight = false): XLSX.CellObject {
    const isNum = typeof v === "number";
    return {
      v, t: isNum ? "n" : "s",
      s: {
        font:      { name: "Arial", sz: 9, bold: highlight },
        fill:      highlight ? { patternType: "solid", fgColor: { rgb: INPUT_FILL } } : undefined,
        alignment: { horizontal: isNum ? "right" : "left", vertical: "center" },
        numFmt:    isNum ? "#,##0.00" : undefined,
        border:    {
          top:    { style: highlight ? "medium" : "thin" },
          bottom: { style: highlight ? "medium" : "thin" },
          left:   { style: highlight ? "medium" : "thin" },
          right:  { style: highlight ? "medium" : "thin" },
        },
      },
    };
  }

  function codeCell(v: string): XLSX.CellObject {
    return {
      v, t: "s",
      s: {
        font:      { name: "Arial", sz: 9, bold: true, color: { rgb: SARS_RED } },
        fill:      { patternType: "solid", fgColor: { rgb: INPUT_FILL } },
        alignment: { horizontal: "center", vertical: "center" },
        border:    { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      },
    };
  }

  function emptyCell(): XLSX.CellObject {
    return {
      v: "", t: "s",
      s: { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } },
    };
  }

  // ── SHEET 1: Summary Dashboard ─────────────────────────────────────────────
  {
    const rows: XLSX.CellObject[][] = [];
    const push = (...cells: XLSX.CellObject[]) => rows.push(cells);

    push(hdrCell(`MYEXPENSE - ITR12 eFILING REFERENCE  |  Tax Year: ${data.meta.tax_year}  |  Generated: ${new Date(data.meta.generated_at).toLocaleDateString("en-ZA")}`));
    push(labelCell("Use this workbook alongside your SARS eFiling ITR12 return. Yellow cells show your figures. Field names match the exact labels in eFiling."));
    push(emptyCell());

    push(hdrCell("TAXPAYER DETAILS"));
    push(labelCell("Full Name"),        valueCell(data.taxpayer.full_name, true),     emptyCell(), emptyCell());
    push(labelCell("Business Name"),    valueCell(data.taxpayer.business_name, true), emptyCell(), emptyCell());
    push(labelCell("Tax Reference No"), valueCell(data.taxpayer.tax_number, true),    emptyCell(), emptyCell());
    push(labelCell("Work Type"),        valueCell(data.taxpayer.work_type, true),     emptyCell(), emptyCell());
    push(emptyCell());

    push(hdrCell("INCOME SUMMARY  (ITR12 Local Business, Trade and Professional Income – Pg 11-12)"));
    push(labelCell("ITR12 Field", 1), hdrCell("Amount (R)", SARS_MID), hdrCell("SARS Section", SARS_MID), hdrCell("Code", SARS_MID));
    for (const [source, amount] of Object.entries(data.income.by_source)) {
      push(labelCell(source), valueCell(amount, true), labelCell("Business / Trading – Profit"), codeCell("4222"));
    }
    push(labelCell("Turnover / Sales  (total income – enter in eFiling Income field)", 1), valueCell(data.income.total, true), emptyCell(), emptyCell());
    push(emptyCell());

    push(hdrCell("EXPENDITURE SUMMARY  (ITR12 Local Business, Trade and Professional Income – Pg 11-12)"));
    push(labelCell("ITR12 Field (enter in Expenditure section)", 1), hdrCell("Amount (R)", SARS_MID), hdrCell("SARS Section", SARS_MID), emptyCell());

    for (const [field, amount] of Object.entries(data.expenses.by_field).sort(([,a],[,b]) => b - a)) {
      push(labelCell(field), valueCell(amount, true), labelCell("Pg 11-12 Expenditure"), emptyCell());
    }
    if (data.mileage.deductible_rand > 0) {
      push(labelCell("Travel Costs – Local  (mileage @ R" + data.meta.mileage_rate.toFixed(2) + "/km)"), valueCell(data.mileage.deductible_rand, true), labelCell("Pg 11-12 Expenditure"), emptyCell());
    }
    push(emptyCell());

    push(hdrCell("RETIREMENT ANNUITY  (Pg 23 – Retirement Annuity Fund Contributions)", SARS_MID));
    push(labelCell("Total contributions for this year of assessment"), valueCell(data.expenses.ra_contributions, true), labelCell("Pg 23"), codeCell("4006"));
    push(emptyCell());

    push(hdrCell("TAX ESTIMATE  (for reference only – SARS calculates your final liability)"));
    push(labelCell("Gross Income"),           valueCell(data.tax_estimate.gross_income,     true), emptyCell(), emptyCell());
    push(labelCell("Less: Total Deductions"), valueCell(data.tax_estimate.total_deductions, true), emptyCell(), emptyCell());
    push(labelCell("= Taxable Income"),       valueCell(data.tax_estimate.taxable_income,   true), emptyCell(), emptyCell());
    push(labelCell("Marginal Rate"),          valueCell(pct(data.tax_estimate.marginal_rate)),      emptyCell(), emptyCell());
    push(labelCell("Estimated Tax"),          valueCell(data.tax_estimate.estimated_tax,    true), emptyCell(), emptyCell());
    push(emptyCell());

    push(hdrCell("ITR12 READINESS", SARS_MID));
    push(labelCell("Receipt Coverage"),  valueCell(`${data.expenses.itr12_readiness_pct}% of expenses have receipts attached`), emptyCell(), emptyCell());
    push(labelCell("Mileage Logbook"),   valueCell(`${data.mileage.total_km.toLocaleString()} km total  |  ${data.mileage.deductible_km.toLocaleString()} km business  |  ${R(data.mileage.deductible_rand)} deductible`), emptyCell(), emptyCell());
    push(labelCell("Entertainment Cap"), valueCell(`Gross ${R(data.expenses.meals_entertainment.gross)}  ->  Deductible ${R(data.expenses.meals_entertainment.deductible)}  (80% cap applied per s23(o))`), emptyCell(), emptyCell());
    push(labelCell("Non-Deductible"),    valueCell(R(data.expenses.non_deductible_total)), emptyCell(), emptyCell());
    push(emptyCell());
    push(labelCell("NOTE: This is a reference document only. Submit your actual return via SARS eFiling at www.sars.gov.za or through a registered tax practitioner."));

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 52 }, { wch: 20 }, { wch: 32 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
  }

  // ── SHEET 2: Pg 11-12 Local Business Income ───────────────────────────────
  // Field labels match the exact names in the SARS eFiling Local Business,
  // Trade and Professional Income section.
  {
    const rows: XLSX.CellObject[][] = [];
    const push = (...cells: XLSX.CellObject[]) => rows.push(cells);

    push(hdrCell("ITR12 PAGE 11-12  |  Local Business, Trade and Professional Income"));
    push(labelCell("Enter each figure into the matching field in SARS eFiling. Field names below are identical to those in eFiling."));
    push(emptyCell());

    push(hdrCell("INCOME", SARS_MID));
    push(labelCell("ITR12 Field", 1), hdrCell("Your Amount (R)", SARS_MID), hdrCell("Notes", SARS_MID), emptyCell());
    push(labelCell("Turnover / Sales"), valueCell(data.income.total, true), labelCell("Enter your total income here – Gross profit section"), emptyCell());
    push(emptyCell());

    push(hdrCell("EXPENDITURE – enter each figure into the matching field in eFiling", SARS_MID));
    push(labelCell("ITR12 Field", 1), hdrCell("Your Amount (R)", SARS_MID), hdrCell("Notes", SARS_MID), emptyCell());

    // Ordered to match the Expenditure field order in the actual ITR12 form (Pg 11-12)
    const FIELD_ORDER = [
      "Accounting Fees",
      "Administration Cost",
      "Bad Debts",
      "Bank Charges",
      "Capital Allowances",
      "Commission paid",
      "Consulting Fees Paid",
      "Depreciation",
      "Electricity / Rates and Taxes",
      "Entertainment",
      "Insurance",
      "Interest / Finance Charges",
      "Lease Payment",
      "Legal Costs",
      "Provision for Doubtful Debts",
      "Rental Paid",
      "Repairs / Maintenance",
      "Royalties and License Fees",
      "Salaries and Wages",
      "Telephone",
      "Travel Costs – Local",
      "Travel Costs – Foreign",
      "Other",
    ];

    // Output populated fields in form order, then any remainder
    const printed = new Set<string>();
    for (const field of FIELD_ORDER) {
      const amt = data.expenses.by_field[field] ?? 0;
      if (amt > 0) {
        push(labelCell(field), valueCell(amt, true), emptyCell(), emptyCell());
        printed.add(field);
      }
    }
    // Mileage goes into Travel Costs – Local (if not already captured above)
    if (data.mileage.deductible_rand > 0) {
      push(
        labelCell("Travel Costs – Local  (mileage – R" + data.meta.mileage_rate.toFixed(2) + "/km × " + data.mileage.deductible_km.toLocaleString() + " km)"),
        valueCell(data.mileage.deductible_rand, true),
        labelCell("Add to any vehicle running costs already claimed above"),
        emptyCell(),
      );
    }
    // Any field not in FIELD_ORDER
    for (const [field, amt] of Object.entries(data.expenses.by_field)) {
      if (!printed.has(field) && amt > 0) {
        push(labelCell(field), valueCell(amt, true), emptyCell(), emptyCell());
      }
    }
    push(emptyCell());
    push(
      labelCell("NOTE: Entertainment (80% cap)"),
      valueCell(data.expenses.meals_entertainment.deductible, true),
      labelCell(`Gross ${R(data.expenses.meals_entertainment.gross)} – 80% deductible per s23(o). Enter the amount above under 'Entertainment' in eFiling.`),
      emptyCell(),
    );

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 44 }, { wch: 18 }, { wch: 50 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, "Pg11-12 Business Income");
  }

  // ── SHEET 3: Pg 23 Retirement Annuity & Medical ───────────────────────────
  // Codes on this page ARE standalone source codes in the SARS form.
  {
    const rows: XLSX.CellObject[][] = [];
    const push = (...cells: XLSX.CellObject[]) => rows.push(cells);

    push(hdrCell("ITR12 PAGE 23  |  Retirement Annuity Fund Contributions & Medical Deductions"));
    push(labelCell("Field names and codes below match the Deductions section of eFiling exactly."));
    push(emptyCell());

    push(hdrCell("RETIREMENT ANNUITY FUND CONTRIBUTIONS", SARS_MID));
    push(labelCell("ITR12 Field", 1), hdrCell("Your Amount (R)", SARS_MID), hdrCell("Code", SARS_MID), labelCell("Notes", 1));
    push(
      labelCell("Total contributions for this year of assessment"),
      valueCell(data.expenses.ra_contributions, true),
      codeCell("4006"),
      labelCell(`Capped at 27.5% of income or R350 000 (whichever is less). Your cap: ${R(Math.min(data.income.total * RA_CAP_RATE, RA_CAP_MAX))}`),
    );
    push(emptyCell());

    push(hdrCell("MEDICAL DEDUCTIONS  (enter from your medical aid tax certificate – not from MyExpense)", SARS_MID));
    push(labelCell("ITR12 Field", 1), hdrCell("Your Amount (R)", SARS_MID), hdrCell("Code", SARS_MID), labelCell("Notes", 1));
    push(labelCell("State the total medical contributions made by yourself and / or your employer to this scheme (incl. subsidies from former employer)"), labelCell("From medical aid certificate"), codeCell("4005"), labelCell("Enter from your medical scheme tax certificate"));
    push(labelCell("State any medical expenses paid by you that were claimed from your medical scheme and reflected on the medical certificate (other than physical impairment or disability expenses)"), labelCell("From medical aid certificate"), codeCell("4020"), labelCell("Expenses claimed from scheme – on certificate"));
    push(labelCell("State any qualifying medical expenses paid by you that were not claimed from any medical scheme and not reflected on any medical scheme certificate (other than physical impairment or disability expenses)"), labelCell("If applicable"), codeCell("4034"), labelCell("Out-of-pocket qualifying medical expenses – not on any certificate"));
    push(labelCell("State any qualifying physical impairment expenses paid by you and not recovered from any medical scheme(s) and not included above"), labelCell("If applicable"), codeCell("4022"), labelCell("Physical impairment expenses only"));
    push(labelCell("State the qualifying disability expenses paid by you i.r.o yourself, your spouse and qualifying children and not recovered from any medical scheme and not included in any expenses claimed above"), labelCell("If applicable"), codeCell("4023"), labelCell("Confirmed by ITR-DD from registered medical practitioner"));
    push(emptyCell());

    push(hdrCell("NON-DEDUCTIBLE EXPENSES  (do NOT enter in eFiling)", SARS_MID));
    push(labelCell("Non-Deductible Total"), valueCell(data.expenses.non_deductible_total, true), emptyCell(), labelCell("Asset purchases, loans, personal – not claimable"));

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 52 }, { wch: 26 }, { wch: 10 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws, "Pg23 RA and Medical");
  }

  // ── SHEET 4: Pg 24 Travel Claim & Mileage ─────────────────────────────────
  {
    const rows: XLSX.CellObject[][] = [];
    const push = (...cells: XLSX.CellObject[]) => rows.push(cells);

    push(hdrCell("ITR12 PAGE 24  |  Travel Claim Against Allowance – Details of Kilometres Travelled"));
    push(labelCell("Field names match the exact labels in the eFiling Travel Claim section (Pg 24)."));
    push(emptyCell());

    push(hdrCell("DETAILS OF KILOMETRES TRAVELLED", SARS_MID));
    push(labelCell("ITR12 Field", 1), hdrCell("Your Figure", SARS_MID), emptyCell(), emptyCell());
    push(labelCell("Did you use a logbook to determine your business km travelled?"), labelCell("Y  (MyExpense mileage trips are your logbook)"), emptyCell(), emptyCell());
    push(labelCell("Opening Kilometres"),                       valueCell(labelCell("See your logbook / MyExpense first trip entry").v as string), emptyCell(), emptyCell());
    push(labelCell("Closing Kilometres"),                       valueCell(labelCell("See your logbook / MyExpense last trip entry").v as string),  emptyCell(), emptyCell());
    push(labelCell("Total Kilometres"),                         valueCell(data.mileage.total_km, true),      emptyCell(), emptyCell());
    push(labelCell("Business Kilometres"),                      valueCell(data.mileage.deductible_km, true), emptyCell(), emptyCell());
    push(emptyCell());

    push(hdrCell("WHERE RECORDS OF ACTUAL EXPENDITURE WERE KEPT  (if claiming actual vehicle costs)", SARS_MID));
    push(labelCell("ITR12 Field", 1), hdrCell("Your Amount (R)", SARS_MID), labelCell("Notes", 1), emptyCell());
    const vehicleAmt = data.expenses.by_field["Travel Costs – Local"] ?? 0;
    push(labelCell("Fuel and Oil"),          vehicleAmt > 0 ? valueCell(vehicleAmt, true) : labelCell("Enter from records"), labelCell("Portion attributable to business use"), emptyCell());
    push(labelCell("Maintenance and Repairs"), labelCell("Enter from records"), emptyCell(), emptyCell());
    push(labelCell("Insurance and License Fees"), labelCell("Enter from records"), emptyCell(), emptyCell());
    push(labelCell("Wear and Tear"),          labelCell("Enter from records"), emptyCell(), emptyCell());
    push(labelCell("Finance Charges"),        labelCell("Enter from records"), emptyCell(), emptyCell());
    push(emptyCell());

    push(hdrCell("DEEMED RATE CALCULATION  (alternative – if not claiming actual costs)", SARS_MID));
    push(labelCell(`SARS deemed rate per km (${data.meta.tax_year})`), valueCell(`R ${data.meta.mileage_rate.toFixed(2)}`), emptyCell(), emptyCell());
    push(labelCell("Business Kilometres"),    valueCell(data.mileage.deductible_km, true),   emptyCell(), emptyCell());
    push(labelCell("MILEAGE DEDUCTION  (deemed rate × business km)"), valueCell(data.mileage.deductible_rand, true), emptyCell(), emptyCell());
    push(emptyCell());
    push(labelCell("Enter your vehicle registration number, make, model, year and cost price/cash value in eFiling Pg 24."));

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 52 }, { wch: 24 }, { wch: 36 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, "Pg24 Travel and Mileage");
  }

  // ── SHEET 5: Pg 8 Investment Income ───────────────────────────────────────
  {
    const rows: XLSX.CellObject[][] = [];
    const push = (...cells: XLSX.CellObject[]) => rows.push(cells);

    push(hdrCell("ITR12 PAGE 8  |  Taxpayer Information – Income (Investment & Other Income)"));
    push(labelCell("Field names and codes below match the Investment Income section of eFiling exactly."));
    push(emptyCell());

    push(hdrCell("YOUR INCOME BY SOURCE  (from MyExpense income entries)", SARS_MID));
    push(labelCell("ITR12 Field", 1), hdrCell("Amount (R)", SARS_MID), hdrCell("Code", SARS_MID), labelCell("Notes", 1));
    for (const [source, amount] of Object.entries(data.income.by_source)) {
      push(labelCell(source), valueCell(amount, true), codeCell("4222"), labelCell("Business / Trading – Profit (enter net taxable profit on Pg 11-12; code 4222 is the result)"));
    }
    push(emptyCell());

    push(hdrCell("OTHER INCOME FIELDS  (enter in eFiling if applicable – not from MyExpense)", SARS_MID));
    push(labelCell("ITR12 Field", 1), hdrCell("Your Amount (R)", SARS_MID), hdrCell("Code", SARS_MID), labelCell("Notes", 1));
    const otherFields = [
      ["Local Interest",                                    "4201", "Rands only, no cents"],
      ["Foreign Interest",                                  "4218", "Rands only, unless cents specified"],
      ["Gross Foreign Dividends subject to SA normal tax",  "4216", "Rands only, unless cents specified"],
      ["Distribution  (Real Estate Investment Trust/REIT)", "4238", "REIT distribution amount"],
      ["Business / Trading – Profit",                       "4222", "Net taxable profit from Pg 11-12 schedule"],
      ["Business / Trading – Loss",                         "4223", "Net taxable loss from Pg 11-12 schedule"],
    ];
    for (const [field, code, note] of otherFields) {
      push(labelCell(field), labelCell("R  –  enter if applicable"), codeCell(code), labelCell(note));
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 52 }, { wch: 22 }, { wch: 10 }, { wch: 46 }];
    XLSX.utils.book_append_sheet(wb, ws, "Pg8 Investment Income");
  }

  // ── SHEET 6: Full Expense Breakdown ───────────────────────────────────────
  {
    const rows: XLSX.CellObject[][] = [];
    const push = (...cells: XLSX.CellObject[]) => rows.push(cells);

    push(hdrCell(`FULL EXPENSE BREAKDOWN  |  Tax Year ${data.meta.tax_year}`));
    push(labelCell("All populated expenditure fields from your MyExpense data and where to enter them in eFiling."));
    push(emptyCell());

    push(
      hdrCell("ITR12 Field (exact eFiling label)", SARS_MID),
      hdrCell("Your Amount (R)", SARS_MID),
      hdrCell("ITR12 Page / Section", SARS_MID),
      hdrCell("Notes", SARS_MID),
    );

    for (const [field, amount] of Object.entries(data.expenses.by_field).sort(([,a],[,b]) => b - a)) {
      if (amount > 0) {
        push(labelCell(field), valueCell(amount, true), labelCell("Pg 11-12 Expenditure"), emptyCell());
      }
    }
    if (data.mileage.deductible_rand > 0) {
      push(labelCell("Travel Costs – Local  (mileage)"), valueCell(data.mileage.deductible_rand, true), labelCell("Pg 11-12 or Pg 24"), labelCell(`R${data.meta.mileage_rate.toFixed(2)}/km × ${data.mileage.deductible_km.toLocaleString()} km`));
    }
    if (data.expenses.ra_contributions > 0) {
      push(labelCell("Total contributions for this year of assessment  (RA)"), valueCell(data.expenses.ra_contributions, true), labelCell("Pg 23 – Code 4006"), labelCell("27.5% of income / R350 000 cap"));
    }
    push(emptyCell());
    push(labelCell("TOTAL DEDUCTIONS"), valueCell(data.tax_estimate.total_deductions, true), emptyCell(), emptyCell());
    push(emptyCell());
    push(labelCell("Non-Deductible (do NOT enter in eFiling)"), valueCell(data.expenses.non_deductible_total, true), labelCell("–"), labelCell("Not claimable"));

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 48 }, { wch: 18 }, { wch: 26 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(wb, ws, "Full Breakdown");
  }

  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Uint8Array(buffer);
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body    = await req.json().catch(() => ({}));
    const taxYear = body.tax_year ?? "2024/25";

    const data       = await fetchITR12Data(supabase, taxYear);
    const xlsxBuffer = buildXlsx(data);

    const safeName = (data.taxpayer.full_name || "User").replace(/\s+/g, "_");
    const filename  = `MyExpense_ITR12_${safeName}_${taxYear.replace("/", "-")}.xlsx`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      xlsxBuffer.byteLength.toString(),
      },
    });

  } catch (err) {
    console.error("itr12-export error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
