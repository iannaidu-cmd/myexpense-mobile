import { supabase } from "@/lib/supabase";
import type { Receipt } from "@/types/database";

export const receiptService = {
  getReceipts: async (userId: string, limit = 20): Promise<Receipt[]> => {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── Count receipts uploaded this calendar month (free-tier cap enforcement) ─
  countThisMonth: async (userId: string): Promise<number> => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("receipts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};
