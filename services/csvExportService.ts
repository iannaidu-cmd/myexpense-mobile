// ─── CSV Export Service ───────────────────────────────────────────────────────
// Generates a CSV file for expenses compatible with Excel and Google Sheets,
// saves it to the device filesystem, then shares it via the native share sheet.
// ─────────────────────────────────────────────────────────────────────────────

import { expenseService } from "@/services/expenseService";
import type { Expense } from "@/types/database";
import { ITR12_CATEGORIES } from "@/types/database";
import * as FileSystem from "expo-file-system/legacy";
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

function getITR12Code(category: string, itr12_code?: string | null): string {
  if (itr12_code) return itr12_code;
  return ITR12_CATEGORIES[category]?.code ?? "4011";
}

// ─── Core CSV generation ──────────────────────────────────────────────────────

export function generateCSV(expenses: Expense[]): string {
  // BOM for Excel to auto-detect UTF-8
  const BOM = "\uFEFF";

  const HEADER = [
    "Date",
    "Vendor",
    "Category",
    "ITR12 Code",
    "Amount (ZAR)",
    "VAT Amount (ZAR)",
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
    .map((e) =>
      [
        csvField(e.expense_date),
        csvField(e.vendor),
        csvField(e.category),
        csvField(getITR12Code(e.category, e.itr12_code)),
        csvField(Number(e.amount).toFixed(2)),
        csvField(e.vat_amount != null ? Number(e.vat_amount).toFixed(2) : ""),
        csvField(e.is_deductible ? "Y" : "N"),
        csvField(e.notes),
        csvField(e.receipt_url ? "Y" : "N"),
        csvField(e.tax_year),
      ].join(","),
    );

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

  const allExpenses = await expenseService.getExpenses(userId, taxYear);
  const expenses = includePersonal
    ? allExpenses
    : allExpenses.filter((e) => e.is_deductible);

  const csv = generateCSV(expenses);

  const fileName = `MyExpense_ITR12_${taxYear.replace("/", "-")}_${Date.now()}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error(
      "Sharing is not available on this device. Please use a physical device.",
    );
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: `MyExpense expenses ${taxYear}`,
    UTI: "public.comma-separated-values-text",
  });
}
