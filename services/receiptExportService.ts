// ─── Receipt Export Service ────────────────────────────────────────────────
// Bundles every receipt image in a user-chosen date range into a single ZIP
// and hands it to the native share sheet, so it can be saved to Files or
// sent as evidence if SARS requests proof of an expense.
// ─────────────────────────────────────────────────────────────────────────

import { expenseService } from "@/services/expenseService";
import { supabase } from "@/lib/supabase";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";

const SIGNED_URL_TTL = 300; // seconds — just long enough to fetch each file

export interface ReceiptExportOptions {
  userId: string;
  startDate: string; // "YYYY-MM-DD", inclusive
  endDate: string; // "YYYY-MM-DD", inclusive
  onProgress?: (done: number, total: number) => void;
}

export interface ReceiptExportResult {
  fileCount: number;
  skipped: number;
}

function extensionFor(contentType: string | null, storagePath: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/heic" || contentType === "image/heif") return "heic";
  if (contentType === "application/pdf") return "pdf";
  if (contentType === "image/jpeg") return "jpg";
  const match = storagePath.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "jpg";
}

function slugify(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 40) || "receipt";
}

// ── Count receipts in range, for the preview UI before committing to a download ─
export async function countReceiptsInRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<number> {
  const expenses = await expenseService.getExpensesWithReceiptsInRange(
    userId,
    startDate,
    endDate,
  );
  return expenses.length;
}

export async function exportReceiptsZip(
  opts: ReceiptExportOptions,
): Promise<ReceiptExportResult> {
  const { userId, startDate, endDate, onProgress } = opts;

  const expenses = await expenseService.getExpensesWithReceiptsInRange(
    userId,
    startDate,
    endDate,
  );

  if (expenses.length === 0) {
    throw new Error("No receipts found in that date range.");
  }

  const paths = expenses.map((e) => e.storage_path!);
  const { data: signedUrls, error: signError } = await supabase.storage
    .from("receipts")
    .createSignedUrls(paths, SIGNED_URL_TTL);

  if (signError || !signedUrls) {
    throw new Error(signError?.message ?? "Failed to generate download links.");
  }

  const urlByPath = new Map(
    signedUrls.map((row) => [row.path, row.signedUrl] as const),
  );

  const zip = new JSZip();
  const usedNames = new Set<string>();
  let skipped = 0;

  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    const signedUrl = expense.storage_path
      ? urlByPath.get(expense.storage_path)
      : null;

    if (!signedUrl) {
      skipped++;
      onProgress?.(i + 1, expenses.length);
      continue;
    }

    try {
      const response = await fetch(signedUrl);
      if (!response.ok) {
        skipped++;
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const ext = extensionFor(
        response.headers.get("content-type"),
        expense.storage_path!,
      );

      let name = `${expense.expense_date}_${slugify(expense.vendor)}.${ext}`;
      let suffix = 2;
      while (usedNames.has(name)) {
        name = `${expense.expense_date}_${slugify(expense.vendor)}-${suffix}.${ext}`;
        suffix++;
      }
      usedNames.add(name);

      zip.file(name, arrayBuffer);
    } catch {
      skipped++;
    }
    onProgress?.(i + 1, expenses.length);
  }

  if (usedNames.size === 0) {
    throw new Error("Could not download any receipts. Please try again.");
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });

  const fileName = `MyExpense_Receipts_${startDate}_to_${endDate}.zip`;
  const file = new File(Paths.cache, fileName);
  file.write(zipBytes);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error(
      "Sharing is not available on this device. Please use a physical device.",
    );
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/zip",
    dialogTitle: `MyExpense receipts ${startDate} to ${endDate}`,
    UTI: "public.zip-archive",
  });

  return { fileCount: usedNames.size, skipped };
}
