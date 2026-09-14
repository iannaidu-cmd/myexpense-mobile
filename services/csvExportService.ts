// ─── CSV Export Service ───────────────────────────────────────────────────────
// Generates a CSV file for expenses compatible with Excel and Google Sheets,
// saves it to the device filesystem, then shares it via the native share sheet.
// ─────────────────────────────────────────────────────────────────────────────

import { expenseService } from "@/services/expenseService";
import { profileService } from "@/services/profileService";
import type { Expense } from "@/types/database";
import { ITR12_CATEGORIES } from "@/types/database";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escape a CSV field: wrap in quotes and escape inner quotes */
function csvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getITR12Field(category: string): string {
  return ITR12_CATEGORIES[category]?.field || "Other";
}

// ─── Core CSV generation ──────────────────────────────────────────────────────

// `vatRegistered` mirrors the same rule as expenseService.getTotals: a
// registered VAT vendor claims input VAT back separately via VAT201, so
// their income-tax-deductible amount for ITR12 excludes vat_amount.
export function generateCSV(expenses: Expense[], vatRegistered = false): string {
  // BOM for Excel to auto-detect UTF-8
  const BOM = "﻿";

  const HEADER = [
    "Date",
    "Vendor",
    "Category",
    "ITR12 Field (eFiling)",
    "Amount (ZAR)",
    "VAT Amount (ZAR)",
    "Deductible Amount for ITR12 (ZAR)",
    "Deductible (Y/N)",
    "Notes",
    "Receipt Attached",
    "Tax Year",
  ].join(",");

  const rows = expenses
    .sort(
      (a, b) =>
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime(),
    )
    .map((e) => {
      const deductibleAmount = e.is_deductible
        ? vatRegistered
          ? Math.max(0, Number(e.amount) - Number(e.vat_amount ?? 0))
          : Number(e.amount)
        : 0;
      return [
        csvField(e.expense_date),
        csvField(e.vendor),
        csvField(e.category),
        csvField(e.is_deductible ? getITR12Field(e.category) : "—"),
        csvField(Number(e.amount).toFixed(2)),
        csvField(e.vat_amount != null ? Number(e.vat_amount).toFixed(2) : ""),
        csvField(deductibleAmount.toFixed(2)),
        csvField(e.is_deductible ? "Y" : "N"),
        csvField(e.notes),
        csvField(e.receipt_url ? "Y" : "N"),
        csvField(e.tax_year),
      ].join(",");
    });

  return BOM + [HEADER, ...rows].join("\r\n");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CSVExportOptions {
  userId: string;
  taxYear: string;
  includePersonal?: boolean;
}

export async function exportExpensesCSV(opts: CSVExportOptions): Promise<void> {
  const { userId, taxYear, includePersonal = false } = opts;

  const [allExpenses, profile] = await Promise.all([
    expenseService.getExpenses(userId, taxYear),
    profileService.getProfile(userId),
  ]);
  const expenses = includePersonal
    ? allExpenses
    : allExpenses.filter((e) => e.is_deductible);

  const csv = generateCSV(expenses, profile?.vat_registered ?? false);

  const fileName = `MyExpense_ITR12_${taxYear.replace("/", "-")}_${Date.now()}.csv`;
  const file = new File(Paths.cache, fileName);
  file.write(csv, { encoding: "utf8" });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error(
      "Sharing is not available on this device. Please use a physical device.",
    );
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: `MyExpense expenses ${taxYear}`,
    UTI: "public.comma-separated-values-text",
  });
}
