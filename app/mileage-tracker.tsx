import AsyncStorage from "@react-native-async-storage/async-storage";
import { AnnouncementModal } from "@/components/AnnouncementModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { InfoBanner } from "@/components/InfoBanner";
import { useKeepAwake } from "expo-keep-awake";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { VehiclePicker } from "@/components/VehiclePicker";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "@/components/maps";
import { FREE_MILEAGE_TRIP_LIMIT } from "@/constants/freeTier";
import { TRIP_PURPOSES } from "@/constants/tripPurposes";
import { localISODate } from "@/lib/dateInput";
import { taxYearForDate } from "@/lib/taxRules";
import { addressForCoords } from "@/lib/tripAddress";
import { validateTripReason } from "@/lib/validation";
import { mileageService } from "@/services/mileageService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { activeVehicles, useVehicleStore, vehicleLabel } from "@/stores/vehicleStore";
import { colour, radius, space, typography } from "@/tokens";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { safeBack } from "@/lib/navigation";


// ─── Default map region — Johannesburg, SA ────────────────────────────────────
const DEFAULT_REGION = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// ─── Haversine distance ───────────────────────────────────────────────────────
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const platformShadow =
  Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: { boxShadow: "0 2px 8px rgba(0,0,0,0.10)" },
  }) ?? {};

const TRIP_STORAGE_KEY = "mx_trip_in_progress";

type TripStatus = "idle" | "running" | "paused";
interface Coord {
  latitude: number;
  longitude: number;
}

export default function MileageTrackerScreen() {
  const router = useRouter();
  const { user, isPremium, isInitialised, refreshPremiumStatus } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [premiumChecked, setPremiumChecked] = useState(false);
  const [tripLimitReached, setTripLimitReached] = useState(false);
  const [mileageGateReady, setMileageGateReady] = useState(false);

  useEffect(() => {
    if (!isInitialised || !user) return;
    refreshPremiumStatus().finally(() => setPremiumChecked(true));
  }, [isInitialised, user]);

  // Enforce the free-tier trip cap (20/month) once premium status is known.
  // One "use" = one saved trip, counted directly off mileage_trips — no
  // separate log table needed, unlike bank import / ITR12 export, which
  // don't otherwise write a per-use row anywhere.
  // Fails open on a count-check error — a network blip shouldn't block a trip.
  useEffect(() => {
    if (!premiumChecked || !user) return;
    if (isPremium) {
      setMileageGateReady(true);
      return;
    }
    mileageService
      .countThisMonth(user.id)
      .then((count) => {
        if (count >= FREE_MILEAGE_TRIP_LIMIT) setTripLimitReached(true);
      })
      .catch(() => {})
      .finally(() => setMileageGateReady(true));
  }, [premiumChecked, isPremium, user]);

  const [status, setStatus] = useState<TripStatus>("idle");
  const [coords, setCoords] = useState<Coord[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [currentPos, setCurrentPos] = useState<Coord | null>(null);
  const [startPos, setStartPos] = useState<Coord | null>(null);
  const [saving, setSaving] = useState(false);

  const [showPurpose, setShowPurpose] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState(TRIP_PURPOSES[0]);
  // The SARS "reason for the trip" — required (saved to mileage_trips.notes).
  const [tripNote, setTripNote] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [startAddress, setStartAddress] = useState<string | null>(null);

  const { vehicles, load: loadVehicles } = useVehicleStore();
  const tripVehicles = activeVehicles(vehicles);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  // Ask for the vehicle as soon as the tracker opens if the account has none.
  // SARS needs one logbook per vehicle, and a trip can't be started without
  // one. Shown once per visit; it isn't shown if the vehicles couldn't be
  // loaded (e.g. offline), since we can't tell whether the account has one.
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const askedForVehicle = useRef(false);
  useEffect(() => {
    if (!user) return;
    loadVehicles(user.id, activeTaxYear)
      .then(() => {
        if (askedForVehicle.current) return;
        askedForVehicle.current = true;
        if (useVehicleStore.getState().vehicles.length === 0) setShowAddVehicle(true);
      })
      .catch(() => {});
  }, [user, activeTaxYear]);

  // Default to a vehicle once they're loaded — and to the newly added one
  // when the user adds a vehicle from the start-trip sheet.
  const tripVehicleIds = tripVehicles.map((v) => v.id).join(",");
  useEffect(() => {
    if (status !== "idle") return;
    if (selectedVehicleId && tripVehicles.some((v) => v.id === selectedVehicleId)) return;
    setSelectedVehicleId(tripVehicles.length ? tripVehicles[tripVehicles.length - 1].id : null);
  }, [tripVehicleIds, status]);

  const [locationReady, setLocationReady] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useKeepAwake(status !== "idle" ? "mileage-trip" : undefined);

  const mapRef = useRef<MapView>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const bgWatchRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCoordRef = useRef<Coord | null>(null);
  const pausedKmRef = useRef(0);

  // ── Persist trip state so a restart/crash doesn't lose the drive ──────────
  useEffect(() => {
    if (status === "idle") return;
    AsyncStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify({
      status,
      distanceKm,
      elapsed,
      startTime: startTime?.toISOString() ?? null,
      startPos,
      coords,
      selectedPurpose,
      tripNote,
      selectedVehicleId,
      startAddress,
    }));
  }, [status, distanceKm, elapsed, startTime, startPos, coords, selectedPurpose, tripNote, selectedVehicleId, startAddress]);

  // ── Restore in-progress trip on mount ────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(TRIP_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.status === "idle") return;
        setStatus("paused"); // always restore as paused — GPS sub was lost
        setDistanceKm(saved.distanceKm ?? 0);
        setElapsed(saved.elapsed ?? 0);
        setStartTime(saved.startTime ? new Date(saved.startTime) : null);
        setStartPos(saved.startPos ?? null);
        setCoords(saved.coords ?? []);
        if (saved.selectedPurpose) setSelectedPurpose(saved.selectedPurpose);
        setTripNote(saved.tripNote ?? "");
        setSelectedVehicleId(saved.selectedVehicleId ?? null);
        setStartAddress(saved.startAddress ?? null);
        pausedKmRef.current = saved.distanceKm ?? 0;
        Alert.alert(
          "Trip restored",
          "Your previous trip was recovered. Tap Resume to continue tracking.",
        );
      } catch {
        AsyncStorage.removeItem(TRIP_STORAGE_KEY);
      }
    });
  }, []);

  const clearSavedTrip = useCallback(() => {
    AsyncStorage.removeItem(TRIP_STORAGE_KEY);
  }, []);

  // ── Request location permission once the free-tier trip gate is resolved ──
  // Gated on mileageGateReady + !tripLimitReached so a free user who's
  // already used their 20 trips this month (who sees the limit-reached
  // screen instead) is never prompted for location access.
  useEffect(() => {
    if (!mileageGateReady || tripLimitReached) return;
    (async () => {
      try {
        const { status: perm } =
          await Location.requestForegroundPermissionsAsync();
        if (perm !== "granted") {
          Alert.alert(
            "Location Required",
            "MyExpense needs location access to track your business travel for SARS compliance.",
          );
          setLocationReady(true);
          return;
        }

        // Stage 1: try last-known position (instant — uses OS cache)
        try {
          const last = await Location.getLastKnownPositionAsync({ maxAge: 300_000 });
          if (last) {
            setCurrentPos({ latitude: last.coords.latitude, longitude: last.coords.longitude });
            setLocationReady(true);
            return;
          }
        } catch { /* no cached position — fall through */ }

        // Stage 2: watch for first fresh fix, clear watch once received
        try {
          bgWatchRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 0, timeInterval: 2000 },
            (loc) => {
              setCurrentPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
              setLocationReady(true);
              bgWatchRef.current?.remove();
              bgWatchRef.current = null;
              if (gpsTimeoutRef.current) clearTimeout(gpsTimeoutRef.current);
            },
          );
        } catch { /* GPS unavailable */ }

        // Fallback: hide overlay after 20 s regardless so user can still start a trip
        gpsTimeoutRef.current = setTimeout(() => setLocationReady(true), 20_000);
      } catch {
        setLocationReady(true);
      }
    })();
    return () => {
      stopTracking();
      bgWatchRef.current?.remove();
      if (gpsTimeoutRef.current) clearTimeout(gpsTimeoutRef.current);
    };
  }, [mileageGateReady, tripLimitReached]);

  // ── Centre map on first GPS fix ──────────────────────────────────────────
  const hasAnimatedToUser = useRef(false);
  useEffect(() => {
    if (!currentPos || hasAnimatedToUser.current) return;
    hasAnimatedToUser.current = true;
    mapRef.current?.animateToRegion(
      {
        latitude: currentPos.latitude,
        longitude: currentPos.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800,
    );
  }, [currentPos]);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // ── Location tracking ─────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    lastCoordRef.current = currentPos;
    try {
      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10,
          timeInterval: 3000,
        },
        (loc) => {
          const newCoord: Coord = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setCurrentPos(newCoord);
          setCoords((prev) => [...prev, newCoord]);
          if (lastCoordRef.current) {
            const delta = haversineKm(
              lastCoordRef.current.latitude,
              lastCoordRef.current.longitude,
              newCoord.latitude,
              newCoord.longitude,
            );
            setDistanceKm((d) => d + delta);
          }
          lastCoordRef.current = newCoord;
          mapRef.current?.animateToRegion(
            {
              latitude: newCoord.latitude,
              longitude: newCoord.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            500,
          );
        },
      );
    } catch {
      Alert.alert(
        "Location Unavailable",
        "Please enable GPS/location services on your device before starting a trip.",
      );
    }
  }, [currentPos]);

  const stopTracking = useCallback(() => {
    locationSub.current?.remove();
    locationSub.current = null;
  }, []);

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => setShowPurpose(true), []);

  const confirmStart = useCallback(async () => {
    setShowPurpose(false);
    setStartTime(new Date());
    setDistanceKm(0);
    setCoords(currentPos ? [currentPos] : []);
    setStartPos(currentPos);
    setStartAddress(null);
    lastCoordRef.current = currentPos;
    pausedKmRef.current = 0;
    setStatus("running");
    // Resolve the SARS "From" place in the background — never blocks the start.
    addressForCoords(currentPos?.latitude, currentPos?.longitude).then((a) => {
      if (a) setStartAddress(a);
    });
    await startTracking();
  }, [currentPos, startTracking]);

  const startBlocked = !selectedVehicleId || !!validateTripReason(tripNote);

  const handlePause = useCallback(() => {
    stopTracking();
    pausedKmRef.current = distanceKm;
    setStatus("paused");
  }, [stopTracking, distanceKm]);

  const handleResume = useCallback(async () => {
    setStatus("running");
    await startTracking();
  }, [startTracking]);

  // ── Save trip to Supabase ─────────────────────────────────────────────────
  const saveTrip = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const tripDate = localISODate(startTime ?? new Date());
      // Either can come back null (no signal / geocoder unavailable) — the
      // trip still saves and shows in the logbook as needing From/To.
      const [fromAddress, toAddress] = await Promise.all([
        startAddress ?? addressForCoords(startPos?.latitude, startPos?.longitude),
        addressForCoords(currentPos?.latitude, currentPos?.longitude),
      ]);

      const data = await mileageService.createTrip(user.id, {
        purpose: selectedPurpose.label,
        distance_km: parseFloat(distanceKm.toFixed(3)),
        duration_seconds: elapsed,
        start_lat: startPos?.latitude ?? null,
        start_lng: startPos?.longitude ?? null,
        end_lat: currentPos?.latitude ?? null,
        end_lng: currentPos?.longitude ?? null,
        tax_year: taxYearForDate(tripDate),
        notes: tripNote.trim() || null,
        trip_date: tripDate,
        vehicle_id: selectedVehicleId,
        start_address: fromAddress,
        end_address: toAddress,
        odometer_start: null,
        odometer_end: null,
        source: "gps",
      });
      // New business km change the vehicle's wear & tear claim. Not awaited:
      // the summary screen shouldn't wait on it.
      useVehicleStore.getState().syncWearAndTear(user.id, data.tax_year);

      clearSavedTrip();

      // Navigate to summary with saved trip ID
      router.push({
        pathname: "/mileage-trip-summary",
        params: {
          tripId: data.id,
          distanceKm: distanceKm.toFixed(2),
          elapsed: String(elapsed),
          purpose: selectedPurpose.label,
          itr12: selectedPurpose.itr12,
          note: tripNote,
          startTime: startTime?.toISOString() ?? "",
          startLat: String(startPos?.latitude ?? 0),
          startLon: String(startPos?.longitude ?? 0),
          endLat: String(currentPos?.latitude ?? 0),
          endLon: String(currentPos?.longitude ?? 0),
        },
      });
    } catch (e: any) {
      Alert.alert(
        "Save failed",
        e.message ?? "Could not save trip. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    user,
    selectedPurpose,
    distanceKm,
    elapsed,
    startPos,
    currentPos,
    tripNote,
    startTime,
    router,
    selectedVehicleId,
    startAddress,
  ]);

  const handleEnd = useCallback(() => {
    setShowEndConfirm(true);
  }, []);

  const confirmEnd = useCallback(async () => {
    setShowEndConfirm(false);
    stopTracking();
    setStatus("idle");
    await saveTrip();
  }, [stopTracking, saveTrip]);

  // Discard the trip entirely — no row is ever written to mileage_trips.
  // Distinct from handleEnd, which always saves. Lets the user bail out of a
  // trip started by accident (or a test drive) without it landing in their
  // logbook, so there's nothing to clean up afterwards from Trip History.
  const handleCancel = useCallback(() => {
    setShowDiscardConfirm(true);
  }, []);

  const confirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    stopTracking();
    clearSavedTrip();
    setStatus("idle");
    setDistanceKm(0);
    setCoords([]);
    setStartTime(null);
    setElapsed(0);
    setStartPos(null);
    setTripNote("");
    setStartAddress(null);
    lastCoordRef.current = null;
    pausedKmRef.current = 0;
  }, [stopTracking, clearSavedTrip]);

  const elapsedStr = formatElapsed(elapsed);

  // ── Split distance into whole and decimal parts ───────────────────────────
  const [wholeKm, decimalKm] = distanceKm.toFixed(2).split(".");

  if (!mileageGateReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colour.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colour.primary} size="large" />
      </View>
    );
  }

  if (tripLimitReached) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colour.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
        <MXHeader title="Mileage Tracker" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ ...typography.bodyM, fontWeight: "800", fontSize: 20, color: colour.text, marginBottom: 12, textAlign: "center" }}>
            Monthly Trip Limit Reached
          </Text>
          <Text style={{ ...typography.bodyS, color: colour.textSub, textAlign: "center", marginBottom: 32 }}>
            Free accounts can log {FREE_MILEAGE_TRIP_LIMIT} trips a month. Upgrade to Pro for unlimited mileage tracking.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/paywall-upgrade" as any)}
            style={{ backgroundColor: colour.primary, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 32 }}
          >
            <Text style={{ ...typography.btnL, color: colour.textOnPrimary }}>Upgrade to Pro</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => safeBack(router)} style={{ marginTop: 16 }}>
            <Text style={{ ...typography.bodyS, color: colour.textSub }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <SafeAreaView edges={["top"]} style={{ backgroundColor: colour.background }}>
        <MXHeader
          title="Mileage tracker"
          showBack
          right={
            <TouchableOpacity
              onPress={() => router.push("/mileage-history")}
              style={{
                backgroundColor: colour.primary50,
                borderRadius: radius.pill,
                paddingHorizontal: space.md,
                paddingVertical: space.xs,
              }}
            >
              <Text style={{ ...typography.actionS, color: colour.accentDeep }}>
                History
              </Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space["3xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Map - larger at 280px */}
        <View
          style={{
            marginTop: -space.lg,
            marginHorizontal: space.md,
            borderRadius: radius.lg,
            overflow: "hidden",
            height: 280,
            ...platformShadow,
          }}
        >
          <MapView
            ref={mapRef}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            style={{ flex: 1 }}
            userInterfaceStyle="light"
            // The rounded-corner overflow:hidden wrapper above forces Android to
            // composite this SurfaceView into an offscreen layer; without these
            // two flags that renders solid black instead of the map tiles.
            needsOffscreenAlphaCompositing={Platform.OS === "android"}
            renderToHardwareTextureAndroid={Platform.OS === "android"}
            initialRegion={
              currentPos
                ? { ...currentPos, latitudeDelta: 0.01, longitudeDelta: 0.01 }
                : DEFAULT_REGION
            }
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {startPos && (
              <Marker
                coordinate={startPos}
                title="Start"
                pinColor={colour.brandTeal}
              />
            )}
            {coords.length > 1 && (
              <Polyline
                coordinates={coords}
                strokeColor={colour.primary}
                strokeWidth={4}
              />
            )}
          </MapView>
          {!locationReady && (
            <View
              style={{
                position: "absolute",
                bottom: space.sm,
                alignSelf: "center",
                backgroundColor: "rgba(0,0,0,0.55)",
                borderRadius: radius.pill,
                paddingHorizontal: space.md,
                paddingVertical: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ ...typography.captionM, color: "#fff" }}>
                Acquiring GPS…
              </Text>
            </View>
          )}
          {status !== "idle" && (
            <View
              style={{
                position: "absolute",
                top: space.sm,
                left: space.sm,
                backgroundColor:
                  status === "running" ? colour.brandTeal : colour.warning,
                borderRadius: radius.pill,
                paddingHorizontal: space.sm,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: colour.text,
                }}
              />
              <Text style={{ ...typography.captionM, color: colour.text }}>
                {status === "running" ? "TRACKING" : "PAUSED"}
              </Text>
            </View>
          )}
        </View>

        {/* ── Distance card (redesigned) ─────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: space.md,
            marginTop: space.md,
            backgroundColor: colour.white,
            borderRadius: radius.lg,
            padding: space.xl,
            ...platformShadow,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Left: big number */}
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text
                style={{
                  fontSize: 44,
                  fontFamily: "Inter_800ExtraBold",
                  color: colour.text,
                  letterSpacing: -2,
                  lineHeight: 48,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {wholeKm}
              </Text>
              <Text
                style={{
                  fontSize: 36,
                  fontFamily: "Inter_300Light",
                  color: colour.borderLight,
                  lineHeight: 48,
                }}
              >
                .
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: "Inter_700Bold",
                  color: colour.primary,
                  letterSpacing: -1,
                  lineHeight: 48,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {decimalKm}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Inter_600SemiBold",
                  color: colour.textHint,
                  letterSpacing: 0.3,
                  marginLeft: 6,
                  marginBottom: 4,
                }}
              >
                km
              </Text>
            </View>

            {/* Right: noir stat pills */}
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View
                style={{
                  backgroundColor: colour.noir,
                  borderRadius: radius.sm,
                  paddingHorizontal: space.md,
                  paddingVertical: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Inter_700Bold",
                    color: colour.onNoir,
                  }}
                >
                  {elapsedStr}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "Inter_600SemiBold",
                    color: colour.onNoir2,
                  }}
                >
                  DURATION
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colour.primary,
                  borderRadius: radius.sm,
                  paddingHorizontal: space.md,
                  paddingVertical: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Inter_700Bold",
                    color: colour.onPrimary,
                  }}
                >
                  {selectedVehicle?.registration ?? "—"}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "Inter_600SemiBold",
                    color: colour.primary100,
                  }}
                >
                  VEHICLE
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip info card */}
        {status !== "idle" && (
          <View
            style={{
              marginHorizontal: space.md,
              marginTop: space.md,
              backgroundColor: colour.white,
              borderRadius: radius.lg,
              padding: space.md,
              ...platformShadow,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
              }}
            >
              <View
                style={{
                  backgroundColor: colour.primary50,
                  borderRadius: radius.md,
                  padding: space.sm,
                }}
              >
                <IconSymbol name="car.fill" size={18} color={colour.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.bodyM, color: colour.text }}>
                  {selectedPurpose.label}
                </Text>
                <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                  {selectedVehicle ? `${vehicleLabel(selectedVehicle)} · ` : ""}Started{" "}
                  {startTime ? formatTime(startTime) : "—"}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colour.primary50,
                  borderRadius: radius.sm,
                  paddingHorizontal: space.sm,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ ...typography.captionM, color: colour.primary }}>
                  {selectedPurpose.itr12}
                </Text>
              </View>
            </View>
            {tripNote ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: space.sm }}>
                <IconSymbol name="pencil" size={11} color={colour.textSub} />
                <Text style={{ ...typography.bodyXS, color: colour.textSub, flex: 1 }}>
                  {tripNote}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Controls */}
        <View style={{ marginHorizontal: space.md, marginTop: space.lg }}>
          {status === "idle" && (
            <>
              <TouchableOpacity
                onPress={handleStart}
                style={{
                  backgroundColor: colour.primary,
                  borderRadius: radius.pill,
                  paddingVertical: space.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: space.sm,
                }}
                activeOpacity={0.85}
              >
                <IconSymbol name="play.fill" size={20} color={colour.onPrimary} />
                <Text style={{ ...typography.actionL, color: colour.onPrimary }}>
                  Start trip
                </Text>
              </TouchableOpacity>

              <InfoBanner
                title="Work trips only"
                body="Only log trips for work. Driving between home and your usual workplace doesn't count, so don't log it."
                style={{ marginTop: space.md }}
              />
            </>
          )}

          {status === "running" && (
            <View style={{ gap: space.sm }}>
              <TouchableOpacity
                onPress={handlePause}
                style={{
                  backgroundColor: colour.warning,
                  borderRadius: radius.pill,
                  paddingVertical: space.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: space.sm,
                }}
                activeOpacity={0.85}
              >
                <IconSymbol name="pause.fill" size={18} color={colour.onPrimary} />
                <Text style={{ ...typography.actionL, color: colour.onPrimary }}>
                  Pause trip
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEnd}
                disabled={saving}
                style={{
                  backgroundColor: colour.white,
                  borderRadius: radius.pill,
                  paddingVertical: space.md,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: colour.danger,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: space.sm,
                }}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colour.danger} />
                ) : (
                  <>
                    <IconSymbol name="stop.fill" size={18} color={colour.danger} />
                    <Text style={{ ...typography.actionL, color: colour.danger }}>
                      End & save trip
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={saving}
                style={{ alignItems: "center", paddingVertical: space.sm }}
                activeOpacity={0.6}
              >
                <Text style={{ ...typography.actionS, color: colour.textSub }}>
                  Discard trip (don't save)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {status === "paused" && (
            <View style={{ gap: space.sm }}>
              <TouchableOpacity
                onPress={handleResume}
                style={{
                  backgroundColor: colour.primary,
                  borderRadius: radius.pill,
                  paddingVertical: space.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: space.sm,
                }}
                activeOpacity={0.85}
              >
                <IconSymbol name="play.fill" size={18} color={colour.onPrimary} />
                <Text style={{ ...typography.actionL, color: colour.onPrimary }}>
                  Resume trip
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEnd}
                disabled={saving}
                style={{
                  backgroundColor: colour.white,
                  borderRadius: radius.pill,
                  paddingVertical: space.md,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: colour.danger,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: space.sm,
                }}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colour.danger} />
                ) : (
                  <>
                    <IconSymbol name="stop.fill" size={18} color={colour.danger} />
                    <Text style={{ ...typography.actionL, color: colour.danger }}>
                      End & save trip
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={saving}
                style={{ alignItems: "center", paddingVertical: space.sm }}
                activeOpacity={0.6}
              >
                <Text style={{ ...typography.actionS, color: colour.textSub }}>
                  Discard trip (don't save)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Purpose modal */}
      <Modal
        visible={showPurpose}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPurpose(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <View
            style={{
              backgroundColor: colour.white,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingHorizontal: space.md,
              paddingBottom: space["3xl"],
              paddingTop: space.md,
              maxHeight: "90%",
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colour.borderLight,
                borderRadius: radius.pill,
                alignSelf: "center",
                marginBottom: space.md,
              }}
            />
            <Text
              style={{
                ...typography.h4,
                color: colour.text,
                marginBottom: space.xs,
              }}
            >
              New trip
            </Text>
            <Text
              style={{
                ...typography.bodyS,
                color: colour.textSub,
                marginBottom: space.md,
              }}
            >
              SARS needs to know which vehicle you used and why you went.
            </Text>

            <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.xs }}>
              VEHICLE
            </Text>
            <VehiclePicker
              vehicles={tripVehicles}
              selectedId={selectedVehicleId}
              onSelect={setSelectedVehicleId}
              onAddVehicle={() => {
                // Close the sheet first — a native Modal would stay on top of
                // the pushed screen otherwise.
                setShowPurpose(false);
                router.push("/vehicle-form");
              }}
            />

            <Text
              style={{
                ...typography.labelM,
                color: colour.textSub,
                marginTop: space.md,
                marginBottom: space.xs,
              }}
            >
              PURPOSE
            </Text>

            {TRIP_PURPOSES.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setSelectedPurpose(p)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: space.sm,
                  paddingHorizontal: space.sm,
                  borderRadius: radius.md,
                  backgroundColor:
                    selectedPurpose.key === p.key
                      ? colour.primary50
                      : "transparent",
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor:
                      selectedPurpose.key === p.key
                        ? colour.primary
                        : colour.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: space.sm,
                  }}
                >
                  {selectedPurpose.key === p.key && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colour.primary,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{ ...typography.bodyM, color: colour.text, flex: 1 }}
                >
                  {p.label}
                </Text>
                <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                  {p.itr12}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ marginTop: space.md }}>
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.textSub,
                  marginBottom: 4,
                }}
              >
                Why are you going? (SARS needs this)
              </Text>
              <TextInput
                value={tripNote}
                onChangeText={setTripNote}
                placeholder="e.g. Meeting with ABC Ltd re: website quote"
                placeholderTextColor={colour.textHint}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colour.border,
                  paddingVertical: space.xs,
                  ...typography.bodyM,
                  color: colour.text,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={confirmStart}
              disabled={startBlocked}
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                paddingVertical: space.md,
                alignItems: "center",
                marginTop: space.lg,
                flexDirection: "row",
                justifyContent: "center",
                gap: space.sm,
                opacity: startBlocked ? 0.45 : 1,
              }}
              activeOpacity={0.85}
            >
              <IconSymbol name="play.fill" size={18} color={colour.onPrimary} />
              <Text style={{ ...typography.actionL, color: colour.onPrimary }}>
                Start tracking
              </Text>
            </TouchableOpacity>
            {startBlocked && (
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.textSub,
                  textAlign: "center",
                  marginTop: space.sm,
                }}
              >
                {!selectedVehicleId ? "Add your vehicle to start." : "Say why you're going to start."}
              </Text>
            )}
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <MXTabBar />

      <AnnouncementModal
        visible={showAddVehicle && status === "idle"}
        icon="car.fill"
        eyebrow="Mileage logbook"
        title="Add your vehicle"
        subtitle="Your logbook needs your vehicle's make, model, year and number plate, plus its km readings. It takes about a minute."
        primaryLabel="Add vehicle"
        onPrimary={() => {
          setShowAddVehicle(false);
          router.push("/vehicle-form");
        }}
        secondaryLabel="Not now"
        onSecondary={() => setShowAddVehicle(false)}
        onClose={() => setShowAddVehicle(false)}
      />

      <ConfirmModal
        visible={showEndConfirm}
        title="End trip?"
        message={`You've travelled ${distanceKm.toFixed(2)} km. End and save this trip?`}
        confirmLabel="End & Save"
        cancelLabel="Cancel"
        destructive={false}
        icon="checkmark.circle.fill"
        onConfirm={confirmEnd}
        onCancel={() => setShowEndConfirm(false)}
      />
      <ConfirmModal
        visible={showDiscardConfirm}
        title="Discard trip?"
        message={`You've travelled ${distanceKm.toFixed(2)} km. This trip will NOT be saved.`}
        confirmLabel="Discard"
        cancelLabel="Keep tracking"
        destructive
        icon="trash.fill"
        onConfirm={confirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </View>
  );
}
