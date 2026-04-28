import { supabase } from "@/lib/supabase";

export interface MileageTrip {
  id: string;
  user_id: string;
  tax_year: string;
  trip_date: string;
  distance_km: number;
  duration_seconds: number;
  purpose: string;
  is_deductible: boolean;
  start_address: string | null;
  end_address: string | null;
  notes: string | null;
  created_at: string;
}

export const mileageService = {
  getTrips: async (userId: string, taxYear: string): Promise<MileageTrip[]> => {
    const { data, error } = await supabase
      .from("mileage_trips")
      .select("*")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .order("trip_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getTotalBusinessKm: async (userId: string, taxYear: string): Promise<number> => {
    const { data } = await supabase
      .from("mileage_trips")
      .select("distance_km")
      .eq("user_id", userId)
      .eq("tax_year", taxYear);
    return (data ?? []).reduce((sum, t) => sum + Number(t.distance_km), 0);
  },

  deleteTrip: async (id: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from("mileage_trips")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  },
};
