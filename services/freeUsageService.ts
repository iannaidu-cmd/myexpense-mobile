import { supabase } from "@/lib/supabase";

// Note bank-import.tsx writes on every expense it creates. Those expenses are
// already counted once per import via bank_import_log, so they're excluded
// from the hand-added expense count.
const BANK_IMPORT_NOTE = "Imported from bank statement";

async function headCount(query: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// How many of the FREE_USE_LIMIT uses this user has spent, all time, across
// every limited feature. One action = one use:
//   receipts            one row per scan or gallery upload
//   expenses            added by hand only: scanned ones have a receipt
//                       (storage_path), bank-imported ones carry the import
//                       note, and wear-and-tear rows are system-made
//   mileage_trips       one row per trip, GPS or manual
//   bank_import_log     one row per import, however many transactions
//   itr12_export_log    one row per tax report export
//   logbook_export_log  one row per logbook export
// Deliberately NOT cached - it gates a write, so it must always be current.
export async function countFreeUses(userId: string): Promise<number> {
  const counts = await Promise.all([
    headCount(supabase.from("receipts").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    headCount(
      supabase
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("storage_path", null)
        .is("wear_and_tear_vehicle_id", null)
        .or(`notes.is.null,notes.neq."${BANK_IMPORT_NOTE}"`),
    ),
    headCount(supabase.from("mileage_trips").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    headCount(supabase.from("bank_import_log").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    headCount(supabase.from("itr12_export_log").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    headCount(supabase.from("logbook_export_log").select("id", { count: "exact", head: true }).eq("user_id", userId)),
  ]);
  return counts.reduce((sum, n) => sum + n, 0);
}
