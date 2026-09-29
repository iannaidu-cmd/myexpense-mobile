import { create } from "zustand";
import {
  odometerTotalKm,
  vehicleService,
  type OdometerReading,
  type Vehicle,
  type VehicleInput,
} from "@/services/vehicleService";
import { taxLiabilityService } from "@/services/taxLiabilityService";
import { wearAndTearService, type VehicleWearAndTear } from "@/services/wearAndTearService";

export type { OdometerReading, Vehicle, VehicleInput };
export { odometerTotalKm, vehicleLabel } from "@/services/vehicleService";

interface VehicleStore {
  vehicles: Vehicle[];
  // Odometer readings for `readingsTaxYear`, keyed by vehicle id.
  readings: Record<string, OdometerReading>;
  readingsTaxYear: string | null;
  // Which user the cached data belongs to — so signing in as someone else on
  // the same device never shows the previous user's vehicles.
  loadedFor: string | null;
  isLoaded: boolean;
  load: (userId: string, taxYear: string, force?: boolean) => Promise<void>;
  create: (userId: string, v: VehicleInput) => Promise<Vehicle>;
  update: (userId: string, id: string, v: VehicleInput) => Promise<void>;
  setArchived: (userId: string, id: string, isArchived: boolean) => Promise<void>;
  remove: (userId: string, id: string) => Promise<void>;
  saveOdometer: (userId: string, r: OdometerReading) => Promise<void>;
  // s11(e) breakdown per vehicle id for `wearAndTearTaxYear`, from the last sync.
  wearAndTear: Record<string, VehicleWearAndTear>;
  wearAndTearTaxYear: string | null;
  // Recompute wear & tear and update its expense rows. Call after anything
  // that feeds it changes (vehicle details, odometer readings, trips). Never
  // throws: a failed sync just leaves the previous figure until the next one.
  syncWearAndTear: (userId: string, taxYear: string) => Promise<void>;
}

export const activeVehicles = (vehicles: Vehicle[]) => vehicles.filter((v) => !v.isArchived);

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  readings: {},
  readingsTaxYear: null,
  loadedFor: null,
  isLoaded: false,
  wearAndTear: {},
  wearAndTearTaxYear: null,

  syncWearAndTear: async (userId, taxYear) => {
    try {
      const results = await wearAndTearService.sync(userId, taxYear);
      set({
        wearAndTear: Object.fromEntries(results.map((r) => [r.vehicleId, r])),
        wearAndTearTaxYear: taxYear,
      });
      // Wear & tear is a deduction, so the saved refund-or-bill estimate on
      // Home has to move with it.
      await taxLiabilityService.refreshEstimate(userId, taxYear);
    } catch (e) {
      console.error("Wear & tear sync failed:", e);
    }
  },

  load: async (userId, taxYear, force = false) => {
    const s = get();
    if (!force && s.isLoaded && s.loadedFor === userId && s.readingsTaxYear === taxYear) return;
    const [vehicles, readings] = await Promise.all([
      vehicleService.getVehicles(userId),
      vehicleService.getOdometerReadings(userId, taxYear),
    ]);
    set({
      vehicles,
      readings: Object.fromEntries(readings.map((r) => [r.vehicleId, r])),
      readingsTaxYear: taxYear,
      loadedFor: userId,
      isLoaded: true,
    });
  },

  create: async (userId, v) => {
    const vehicle = await vehicleService.createVehicle(userId, v);
    set({ vehicles: [...get().vehicles, vehicle] });
    return vehicle;
  },

  update: async (userId, id, v) => {
    const vehicle = await vehicleService.updateVehicle(userId, id, v);
    set({ vehicles: get().vehicles.map((x) => (x.id === id ? vehicle : x)) });
  },

  setArchived: async (userId, id, isArchived) => {
    await vehicleService.setArchived(userId, id, isArchived);
    set({ vehicles: get().vehicles.map((x) => (x.id === id ? { ...x, isArchived } : x)) });
  },

  remove: async (userId, id) => {
    await vehicleService.deleteVehicle(userId, id);
    const { [id]: _removed, ...readings } = get().readings;
    set({ vehicles: get().vehicles.filter((x) => x.id !== id), readings });
  },

  saveOdometer: async (userId, r) => {
    await vehicleService.saveOdometerReading(userId, r);
    if (get().readingsTaxYear === r.taxYear) {
      set({ readings: { ...get().readings, [r.vehicleId]: r } });
    }
  },
}));

// Business-use % from the logbook: business km on vehicles that have both
// odometer readings for the tax year ÷ those vehicles' total km (closing −
// opening). Null until at least one vehicle has both readings — callers fall
// back to a manual estimate until then.
export function logbookBusinessUse(
  trips: { vehicle_id: string | null; distance_km: number }[],
  readings: Record<string, OdometerReading>,
): { businessKm: number; totalKm: number; ratio: number } | null {
  let totalKm = 0;
  const complete = new Set<string>();
  for (const r of Object.values(readings)) {
    const km = odometerTotalKm(r);
    if (km != null && km > 0) {
      totalKm += km;
      complete.add(r.vehicleId);
    }
  }
  if (totalKm <= 0) return null;
  const businessKm = trips
    .filter((t) => t.vehicle_id && complete.has(t.vehicle_id))
    .reduce((s, t) => s + Number(t.distance_km), 0);
  return { businessKm, totalKm, ratio: Math.min(businessKm / totalKm, 1) };
}
