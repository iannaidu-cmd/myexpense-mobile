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
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  vehicle_id: string | null;
  start_address: string | null;
  end_address: string | null;
  // The SARS "reason for the trip" (e.g. "Site meeting with ABC Ltd").
  // `purpose` is only the category.
  notes: string | null;
  odometer_start: number | null;
  odometer_end: number | null;
  source: "gps" | "manual";
  created_at: string;
}

export type NewMileageTrip = Omit<MileageTrip, "id" | "user_id" | "created_at" | "is_deductible">;

// Logbook details the user can fill in or correct after the trip.
export type TripLogbookDetails = Pick<
  MileageTrip,
  "vehicle_id" | "start_address" | "end_address" | "notes" | "purpose" | "odometer_start" | "odometer_end"
>;

// What SARS needs on every trip that the trip is still missing. Trips logged
// before vehicles existed (or without a reason) show up in the logbook as
// incomplete until these are filled in.
export type MissingLogbookField = "vehicle" | "from" | "to" | "reason";

export function missingLogbookFields(t: MileageTrip): MissingLogbookField[] {
  const missing: MissingLogbookField[] = [];
  if (!t.vehicle_id) missing.push("vehicle");
  if (!t.start_address?.trim()) missing.push("from");
  if (!t.end_address?.trim()) missing.push("to");
  if (!t.notes?.trim()) missing.push("reason");
  return missing;
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

  // Every trip on one vehicle across all tax years (lifetime business km).
  getTripsForVehicle: async (userId: string, vehicleId: string): Promise<MileageTrip[]> => {
    const { data, error } = await supabase
      .from("mileage_trips")
      .select("*")
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getTrip: async (id: string, userId: string): Promise<MileageTrip | null> => {
    const { data, error } = await supabase
      .from("mileage_trips")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  getTotalBusinessKm: async (userId: string, taxYear: string): Promise<number> => {
    const { data } = await supabase
      .from("mileage_trips")
      .select("distance_km")
      .eq("user_id", userId)
      .eq("tax_year", taxYear);
    return (data ?? []).reduce((sum, t) => sum + Number(t.distance_km), 0);
  },

  // Deliberately NOT cached — gates a write (starting a new trip), so it
  // must always reflect the true current count. Mirrors
  // expenseService.countThisMonth / receiptService.countThisMonth.
  countThisMonth: async (userId: string): Promise<number> => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("mileage_trips")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  createTrip: async (userId: string, trip: NewMileageTrip): Promise<MileageTrip> => {
    const { data, error } = await supabase
      .from("mileage_trips")
      .insert({ user_id: userId, is_deductible: true, ...trip })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Manual trips can also change date, tax year and distance (GPS trips can't).
  updateTripDetails: async (
    id: string,
    userId: string,
    details: TripLogbookDetails & Partial<Pick<MileageTrip, "trip_date" | "tax_year" | "distance_km">>,
  ): Promise<void> => {
    const { error } = await supabase
      .from("mileage_trips")
      .update({ ...details, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  // Backfill: put every trip that has no vehicle yet onto this one. Only
  // touches vehicle-less trips so it can never move a trip off the vehicle
  // it was actually logged against.
  assignVehicleToUnassignedTrips: async (userId: string, vehicleId: string, taxYear: string): Promise<void> => {
    const { error } = await supabase
      .from("mileage_trips")
      .update({ vehicle_id: vehicleId, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .is("vehicle_id", null);
    if (error) throw new Error(error.message);
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
