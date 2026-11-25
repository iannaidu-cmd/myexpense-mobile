// Loads what lib/vehicleClaim.ts needs for one tax year: the mileage logbook
// trips, the odometer readings and whether the work type claims vehicle costs.
import { getCached, setCached } from "@/lib/queryCache";
import { vehicleLogbook, type VehicleLogbook } from "@/lib/vehicleClaim";
import { claimsVehicleCostsAsBusiness } from "@/lib/workType";
import { mileageService } from "@/services/mileageService";
import { profileService } from "@/services/profileService";
import { vehicleService } from "@/services/vehicleService";

export async function loadVehicleLogbook(userId: string, taxYear: string): Promise<VehicleLogbook> {
  // Cached under exp: so it is cleared with the expense totals: the wear and
  // tear sync (run after every trip, odometer or work type change) clears it.
  const key = `exp:logbook:${userId}:${taxYear}`;
  const cached = getCached<VehicleLogbook>(key);
  if (cached) return cached;
  const [trips, readings, profile] = await Promise.all([
    mileageService.getTrips(userId, taxYear),
    vehicleService.getOdometerReadings(userId, taxYear),
    profileService.getProfile(userId),
  ]);
  const logbook = vehicleLogbook(trips, readings, claimsVehicleCostsAsBusiness(profile?.work_type));
  setCached(key, logbook);
  return logbook;
}
