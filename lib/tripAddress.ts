import * as Location from "expo-location";

// ─── Trip addresses ───────────────────────────────────────────────────────────
// SARS logbooks need readable "From" and "To" places, not coordinates. These
// turn a GPS point into a short address (e.g. "12 Rivonia Rd, Sandton") via
// the OS geocoder (no API key). Always non-fatal: returns null on any failure
// so saving a trip never depends on the geocoder being reachable.
// ─────────────────────────────────────────────────────────────────────────────

export async function addressForCoords(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): Promise<string | null> {
  if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) return null;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) return null;
    const street = [place.streetNumber, place.street].filter(Boolean).join(" ");
    const area = place.district || place.subregion || place.city;
    const parts = [street || place.name, area].filter(
      (p, i, arr): p is string => !!p && arr.indexOf(p) === i,
    );
    return parts.length ? parts.join(", ") : null;
  } catch {
    return null;
  }
}
