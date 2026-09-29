import { supabase } from '@/lib/supabase';
import type { VehicleType } from '@/lib/wearAndTear';

export type { VehicleType };

// ─── Vehicle Service ──────────────────────────────────────────────────────────
// Vehicles and their per-tax-year odometer readings for the SARS travel
// logbook. SARS requires a separate logbook per vehicle, plus opening (1 March)
// and closing (last day of February) odometer readings each tax year.
// ─────────────────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  vehicleType: VehicleType; // sets the s11(e) write-off period
  purchasePrice: number | null;
  vatClaimed: boolean; // input VAT on the purchase was claimed back (s23C)
  acquiredDate: string | null; // YYYY-MM-DD
  soldDate: string | null;     // YYYY-MM-DD — wear & tear stops, recoupment worked out
  salePrice: number | null;
  isArchived: boolean;
}

export type VehicleInput = Omit<Vehicle, 'id' | 'isArchived'>;

export interface OdometerReading {
  vehicleId: string;
  taxYear: string;
  openingKm: number | null;
  closingKm: number | null;
}

// "2019 Toyota Hilux"
export function vehicleLabel(v: Pick<Vehicle, 'year' | 'make' | 'model'>): string {
  return `${v.year} ${v.make} ${v.model}`;
}

// Total km for the year from the odometer, or null until both readings exist.
export function odometerTotalKm(r: OdometerReading | undefined): number | null {
  if (!r || r.openingKm == null || r.closingKm == null) return null;
  return Math.max(r.closingKm - r.openingKm, 0);
}

const toVehicle = (row: any): Vehicle => ({
  id: row.id,
  make: row.make,
  model: row.model,
  year: Number(row.year),
  registration: row.registration,
  vehicleType: row.vehicle_type ?? 'passenger',
  vatClaimed: !!row.vat_claimed,
  purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : null,
  acquiredDate: row.acquired_date,
  soldDate: row.sold_date ?? null,
  salePrice: row.sale_price != null ? Number(row.sale_price) : null,
  isArchived: row.is_archived,
});

const toRow = (v: VehicleInput) => ({
  make: v.make.trim(),
  model: v.model.trim(),
  year: v.year,
  registration: v.registration.trim().toUpperCase(),
  vehicle_type: v.vehicleType,
  vat_claimed: v.vatClaimed,
  purchase_price: v.purchasePrice,
  acquired_date: v.acquiredDate,
  sold_date: v.soldDate,
  sale_price: v.salePrice,
});

export const vehicleService = {

  // ── All of the user's vehicles, archived included (old trips reference them)
  getVehicles: async (userId: string): Promise<Vehicle[]> => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('is_archived', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(toVehicle);
  },

  createVehicle: async (userId: string, v: VehicleInput): Promise<Vehicle> => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ user_id: userId, ...toRow(v) })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toVehicle(data);
  },

  updateVehicle: async (userId: string, id: string, v: VehicleInput): Promise<Vehicle> => {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...toRow(v), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toVehicle(data);
  },

  setArchived: async (userId: string, id: string, isArchived: boolean): Promise<void> => {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  // Fails (FK) if any trip still references the vehicle — callers should
  // offer archiving instead in that case.
  deleteVehicle: async (userId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  countTripsForVehicle: async (userId: string, vehicleId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('mileage_trips')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId);

    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  // ── Odometer readings ────────────────────────────────────────────────────
  getOdometerReadings: async (userId: string, taxYear: string): Promise<OdometerReading[]> => {
    const { data, error } = await supabase
      .from('vehicle_odometer_readings')
      .select('*')
      .eq('user_id', userId)
      .eq('tax_year', taxYear);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      vehicleId: row.vehicle_id,
      taxYear: row.tax_year,
      openingKm: row.opening_km != null ? Number(row.opening_km) : null,
      closingKm: row.closing_km != null ? Number(row.closing_km) : null,
    }));
  },

  // Every tax year's readings for one vehicle, for lifetime business use
  // (the sale apportionment in SARS IN60 Example 1).
  getAllReadingsForVehicle: async (userId: string, vehicleId: string): Promise<OdometerReading[]> => {
    const { data, error } = await supabase
      .from('vehicle_odometer_readings')
      .select('*')
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      vehicleId: row.vehicle_id,
      taxYear: row.tax_year,
      openingKm: row.opening_km != null ? Number(row.opening_km) : null,
      closingKm: row.closing_km != null ? Number(row.closing_km) : null,
    }));
  },

  saveOdometerReading: async (userId: string, r: OdometerReading): Promise<void> => {
    const { error } = await supabase
      .from('vehicle_odometer_readings')
      .upsert(
        {
          user_id: userId,
          vehicle_id: r.vehicleId,
          tax_year: r.taxYear,
          opening_km: r.openingKm,
          closing_km: r.closingKm,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'vehicle_id,tax_year' },
      );

    if (error) throw new Error(error.message);
  },
};
