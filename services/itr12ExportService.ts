// services/itr12ExportService.ts
// Calls the itr12-export Edge Function and triggers a share/download on device.

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { supabase } from "@/lib/supabase";

interface ExportOptions {
  taxYear: string;
}

interface ExportResult {
  success: boolean;
  error?: string;
}

export async function exportITR12(options: ExportOptions): Promise<ExportResult> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { success: false, error: "Not authenticated. Please sign in and try again." };
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return { success: false, error: "Supabase URL not configured." };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/itr12-export`, {
      method:  "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tax_year: options.taxYear }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: "Unknown error" }));
      return { success: false, error: errBody.error ?? `Server error: ${response.status}` };
    }

    // Write binary response to device cache as base64
    // Note: blob.arrayBuffer() is not implemented in React Native — use response.arrayBuffer() directly
    const arrayBuf = await response.arrayBuffer();
    const uint8    = new Uint8Array(arrayBuf);

    let binary = "";
    uint8.forEach((byte) => { binary += String.fromCharCode(byte); });
    const base64 = btoa(binary);

    const filename = `MyExpense_ITR12_${options.taxYear.replace("/", "-")}.xlsx`;
    const fileUri  = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: "base64",
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: "Sharing is not available on this device." };
    }

    await Sharing.shareAsync(fileUri, {
      mimeType:    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: `ITR12 eFiling Reference - ${options.taxYear}`,
      UTI:         "com.microsoft.excel.xlsx",
    });

    return { success: true };

  } catch (err) {
    console.error("exportITR12 error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Export failed. Please try again.",
    };
  }
}
