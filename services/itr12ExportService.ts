// services/itr12ExportService.ts
// Free-tier usage logging for ITR12 exports. The exports themselves are built
// on the device by services/pdfExportService.ts and services/csvExportService.ts.
// (The old itr12-export edge function and its xlsx download were never used
// by any released build and were removed on 2026-11-15.)

import { supabase } from "@/lib/supabase";

// ─── Free-tier usage tracking ─────────────────────────────────────────────────
// One row per successful export (PDF or CSV). itr12_export_log has no other
// purpose; see the migration that created it. Exports write no row anywhere
// else, unlike scans (receipts) or expenses, so this is the only source of
// truth for the export count.

export async function logItr12Export(userId: string): Promise<void> {
  const { error } = await supabase.from("itr12_export_log").insert({ user_id: userId });
  if (error) throw new Error(error.message);
}
