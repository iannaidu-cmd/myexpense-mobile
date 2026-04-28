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
};
