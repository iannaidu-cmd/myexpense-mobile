import AsyncStorage from "@react-native-async-storage/async-storage";
import { InfoBanner } from "@/components/InfoBanner";
import { useKeepAwake } from "expo-keep-awake";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "@/components/maps";
import { SARS_RATE_PER_KM, taxYearForDate } from "@/lib/taxRules";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
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


// ─── Default map region — Johannesburg, SA ────────────────────────────────────
const DEFAULT_REGION = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// ─── ITR12 purpose categories ─────────────────────────────────────────────────
const TRIP_PURPOSES = [
  { key: "client_visit", label: "Client Visit", itr12: "S11(a)" },
  { key: "supplier", label: "Supplier / Procurement", itr12: "S11(a)" },
  { key: "business_errand", label: "Business Errand", itr12: "S11(a)" },
  { key: "site_inspection", label: "Site Inspection", itr12: "S11(a)" },
  { key: "conference", label: "Conference / Event", itr12: "S11(a)" },
  { key: "office_supplies", label: "Office Supplies Run", itr12: "S11(a)" },
  { key: "other_business", label: "Other Business Travel", itr12: "S11(a)" },
];

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

  // Mileage tracking is Pro-only — zero free-tier access. Mirrors
  // app/itr12-export-setup.tsx's gate exactly.
  useEffect(() => {
    if (!isInitialised || !user) return;
    refreshPremiumStatus().finally(() => setPremiumChecked(true));
  }, [isInitialised, user]);

  useEffect(() => {
    if (!premiumChecked) return;
    if (!isPremium) {
      router.replace("/paywall-upgrade" as any);
    }
  }, [premiumChecked, isPremium]);

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
  const [tripNote, setTripNote] = useState("");

  const [locationReady, setLocationReady] = useState(false);

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
    }));
  }, [status, distanceKm, elapsed, startTime, startPos, coords, selectedPurpose, tripNote]);

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

  // ── Request location permission once premium status is confirmed ─────────
  // Gated on isPremium so a free user (who gets redirected to the paywall)
  // is never prompted for location access on a screen they can't use.
  useEffect(() => {
    if (!premiumChecked || !isPremium) return;
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
  }, [premiumChecked, isPremium]);

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
    lastCoordRef.current = currentPos;
    pausedKmRef.current = 0;
    setStatus("running");
    await startTracking();
  }, [currentPos, startTracking]);

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
      const { supabase } = await import("@/lib/supabase");
      const tripDate = (startTime ?? new Date()).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("mileage_trips")
        .insert({
          user_id: user.id,
          purpose: selectedPurpose.label,
          distance_km: parseFloat(distanceKm.toFixed(3)),
          duration_seconds: elapsed,
          start_lat: startPos?.latitude ?? null,
          start_lng: startPos?.longitude ?? null,
          end_lat: currentPos?.latitude ?? null,
          end_lng: currentPos?.longitude ?? null,
          tax_year: taxYearForDate(tripDate),
          is_deductible: true,
          notes: tripNote || null,
          trip_date: tripDate,
        })
        .select()
        .single();

      if (error) throw error;

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
  ]);

  const handleEnd = useCallback(() => {
    Alert.alert(
      "End Trip?",
      `You've travelled ${distanceKm.toFixed(2)} km. End and save this trip?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End & Save",
          onPress: async () => {
            stopTracking();
            setStatus("idle");
            await saveTrip();
          },
        },
      ],
    );
  }, [distanceKm, stopTracking, saveTrip]);

  // Discard the trip entirely — no row is ever written to mileage_trips.
  // Distinct from handleEnd, which always saves. Lets the user bail out of a
  // trip started by accident (or a test drive) without it landing in their
  // logbook, so there's nothing to clean up afterwards from Trip History.
  const handleCancel = useCallback(() => {
    Alert.alert(
      "Discard Trip?",
      `You've travelled ${distanceKm.toFixed(2)} km. This trip will NOT be saved.`,
      [
        { text: "Keep Tracking", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            stopTracking();
            clearSavedTrip();
            setStatus("idle");
            setDistanceKm(0);
            setCoords([]);
            setStartTime(null);
            setElapsed(0);
            setStartPos(null);
            setTripNote("");
            lastCoordRef.current = null;
            pausedKmRef.current = 0;
          },
        },
      ],
    );
  }, [distanceKm, stopTracking, clearSavedTrip]);

  const deductionEstimate = distanceKm * SARS_RATE_PER_KM;
  const elapsedStr = formatElapsed(elapsed);

  // ── Split distance into whole and decimal parts ───────────────────────────
  const [wholeKm, decimalKm] = distanceKm.toFixed(2).split(".");

  if (!premiumChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colour.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colour.primary} size="large" />
      </View>
    );
  }
  if (!isPremium) return null; // router.replace to /paywall-upgrade already in flight

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
                pinColor={colour.success}
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
                  status === "running" ? colour.success : colour.warning,
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
                  backgroundColor: colour.onPrimary,
                }}
              />
              <Text style={{ ...typography.captionM, color: colour.onPrimary }}>
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
                  R{deductionEstimate.toFixed(2)}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "Inter_600SemiBold",
                    color: colour.primary100,
                  }}
                >
                  DEDUCTION
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
                  {selectedPurpose.itr12} · Started{" "}
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
                title={`SARS deemed rate ${activeTaxYear}: R${SARS_RATE_PER_KM}/km`}
                body="Only business travel is deductible under S11(a). Personal trips are excluded."
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
            }}
          >
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
              Trip purpose
            </Text>
            <Text
              style={{
                ...typography.bodyS,
                color: colour.textSub,
                marginBottom: space.md,
              }}
            >
              Select the business purpose for SARS ITR12 compliance.
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
                Note (optional)
              </Text>
              <TextInput
                value={tripNote}
                onChangeText={setTripNote}
                placeholder="e.g. Meeting at Sandton client office"
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
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                paddingVertical: space.md,
                alignItems: "center",
                marginTop: space.lg,
                flexDirection: "row",
                justifyContent: "center",
                gap: space.sm,
              }}
              activeOpacity={0.85}
            >
              <IconSymbol name="play.fill" size={18} color={colour.onPrimary} />
              <Text style={{ ...typography.actionL, color: colour.onPrimary }}>
                Start tracking
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <MXTabBar />
    </View>
  );
}
