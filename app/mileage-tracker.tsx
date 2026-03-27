import { MXTabBar } from "@/components/MXTabBar";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "@/components/maps";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// ─── SARS deemed cost rate for 2024/25 tax year ───────────────────────────────
const SARS_RATE_PER_KM = 4.84;

// ─── ITR12 purpose categories ─────────────────────────────────────────────────
const TRIP_PURPOSES = [
  { key: "client_visit",    label: "Client Visit",            itr12: "S11(a)" },
  { key: "supplier",        label: "Supplier / Procurement",  itr12: "S11(a)" },
  { key: "business_errand", label: "Business Errand",         itr12: "S11(a)" },
  { key: "site_inspection", label: "Site Inspection",         itr12: "S11(a)" },
  { key: "conference",      label: "Conference / Event",      itr12: "S11(a)" },
  { key: "office_supplies", label: "Office Supplies Run",     itr12: "S11(a)" },
  { key: "other_business",  label: "Other Business Travel",   itr12: "S11(a)" },
];

// ─── Haversine distance ───────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

const platformShadow = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  android: { elevation: 4 },
  default: { boxShadow: "0 2px 8px rgba(0,0,0,0.10)" },
}) ?? {};

type TripStatus = "idle" | "running" | "paused";
interface Coord { latitude: number; longitude: number; }

export default function MileageTrackerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [status, setStatus]         = useState<TripStatus>("idle");
  const [coords, setCoords]         = useState<Coord[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [startTime, setStartTime]   = useState<Date | null>(null);
  const [elapsed, setElapsed]       = useState(0);
  const [currentPos, setCurrentPos] = useState<Coord | null>(null);
  const [startPos, setStartPos]     = useState<Coord | null>(null);
  const [saving, setSaving]         = useState(false);

  const [showPurpose, setShowPurpose]       = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState(TRIP_PURPOSES[0]);
  const [tripNote, setTripNote]             = useState("");

  const mapRef        = useRef<MapView>(null);
  const locationSub   = useRef<Location.LocationSubscription | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoordRef  = useRef<Coord | null>(null);
  const pausedKmRef   = useRef(0);

  // ── Request location permission on mount ─────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        Alert.alert("Location Required", "MyExpense needs location access to track your business travel for SARS compliance.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    })();
    return () => stopTracking();
  }, []);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // ── Location tracking ─────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    lastCoordRef.current = currentPos;
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10, timeInterval: 3000 },
      (loc) => {
        const newCoord: Coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentPos(newCoord);
        setCoords((prev) => [...prev, newCoord]);
        if (lastCoordRef.current) {
          const delta = haversineKm(lastCoordRef.current.latitude, lastCoordRef.current.longitude, newCoord.latitude, newCoord.longitude);
          setDistanceKm((d) => d + delta);
        }
        lastCoordRef.current = newCoord;
        mapRef.current?.animateToRegion({ latitude: newCoord.latitude, longitude: newCoord.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500);
      }
    );
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
          user_id:          user.id,
          purpose:          selectedPurpose.label,
          distance_km:      parseFloat(distanceKm.toFixed(3)),
          duration_seconds: elapsed,
          start_lat:        startPos?.latitude ?? null,
          start_lng:        startPos?.longitude ?? null,
          end_lat:          currentPos?.latitude ?? null,
          end_lng:          currentPos?.longitude ?? null,
          tax_year:         ACTIVE_TAX_YEAR,
          is_deductible:    true,
          notes:            tripNote || null,
          trip_date:        tripDate,
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to summary with saved trip ID
      router.push({
        pathname: "/mileage-trip-summary",
        params: {
          tripId:    data.id,
          distanceKm: distanceKm.toFixed(2),
          elapsed:   String(elapsed),
          purpose:   selectedPurpose.label,
          itr12:     selectedPurpose.itr12,
          note:      tripNote,
          startTime: startTime?.toISOString() ?? "",
          startLat:  String(startPos?.latitude ?? 0),
          startLon:  String(startPos?.longitude ?? 0),
          endLat:    String(currentPos?.latitude ?? 0),
          endLon:    String(currentPos?.longitude ?? 0),
        },
      });
    } catch (e: any) {
      Alert.alert("Save failed", e.message ?? "Could not save trip. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [user, selectedPurpose, distanceKm, elapsed, startPos, currentPos, tripNote, startTime, router]);

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
      ]
    );
  }, [distanceKm, stopTracking, saveTrip]);

  const deductionEstimate = distanceKm * SARS_RATE_PER_KM;
  const elapsedStr = formatElapsed(elapsed);

  return (
    <View style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colour.primary }}>
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space["4xl"] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/mileage-history")}
              style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs }}
            >
              <Text style={{ ...typography.actionS, color: colour.onPrimary }}>History</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ ...typography.labelS, color: "rgba(255,255,255,0.75)" }}>Expense Tracking</Text>
          <Text style={{ ...typography.h3, color: colour.onPrimary }}>Mileage Tracker</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space["3xl"] }} showsVerticalScrollIndicator={false}>

        {/* Map */}
        <View style={{ marginTop: -space.lg, marginHorizontal: space.md, borderRadius: radius.lg, overflow: "hidden", height: 240, ...platformShadow }}>
          {currentPos ? (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{ ...currentPos, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
            >
              {startPos && <Marker coordinate={startPos} title="Start" pinColor={colour.success} />}
              {coords.length > 1 && <Polyline coordinates={coords} strokeColor={colour.primary} strokeWidth={4} />}
            </MapView>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colour.surface1 }}>
              <ActivityIndicator color={colour.primary} />
              <Text style={{ ...typography.bodyS, color: colour.textSub, marginTop: space.xs }}>Locating you…</Text>
            </View>
          )}
          {status !== "idle" && (
            <View style={{ position: "absolute", top: space.sm, left: space.sm, backgroundColor: status === "running" ? colour.success : colour.warning, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colour.onPrimary }} />
              <Text style={{ ...typography.captionM, color: colour.onPrimary }}>{status === "running" ? "LIVE" : "PAUSED"}</Text>
            </View>
          )}
        </View>

        {/* Odometer card */}
        <View style={{ marginHorizontal: space.md, marginTop: space.md, backgroundColor: colour.white, borderRadius: radius.lg, padding: space.lg, ...platformShadow }}>
          <Text style={{ ...typography.captionM, color: colour.textSub, marginBottom: space.xs }}>DISTANCE TRAVELLED</Text>
          <OdometerDisplay km={distanceKm} />
          <Text style={{ ...typography.bodyXS, color: colour.textHint, textAlign: "center", marginTop: 2 }}>kilometres</Text>
          <View style={{ flexDirection: "row", marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colour.borderLight, gap: space.sm }}>
            <StatPill label="Duration"      value={elapsedStr}                      icon="⏱" />
            <StatPill label="SARS Rate"     value={`R${SARS_RATE_PER_KM}/km`}       icon="📋" />
            <StatPill label="Est. Deduction" value={`R${deductionEstimate.toFixed(2)}`} icon="💰" highlight />
          </View>
        </View>

        {/* Trip info card */}
        {status !== "idle" && (
          <View style={{ marginHorizontal: space.md, marginTop: space.md, backgroundColor: colour.white, borderRadius: radius.lg, padding: space.md, ...platformShadow }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <View style={{ backgroundColor: colour.primary50, borderRadius: radius.md, padding: space.sm }}>
                <Text style={{ fontSize: 18 }}>🚗</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.bodyM, color: colour.text }}>{selectedPurpose.label}</Text>
                <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                  {selectedPurpose.itr12} · Started {startTime ? formatTime(startTime) : "—"}
                </Text>
              </View>
              <View style={{ backgroundColor: colour.primary50, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 4 }}>
                <Text style={{ ...typography.captionM, color: colour.primary }}>{selectedPurpose.itr12}</Text>
              </View>
            </View>
            {tripNote ? (
              <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: space.sm }}>📝 {tripNote}</Text>
            ) : null}
          </View>
        )}

        {/* SARS compliance note */}
        <View style={{ marginHorizontal: space.md, marginTop: space.md, backgroundColor: colour.primary50, borderRadius: radius.md, padding: space.md, flexDirection: "row", gap: space.sm }}>
          <Text style={{ fontSize: 16 }}>ℹ️</Text>
          <Text style={{ ...typography.bodyXS, color: colour.primary, flex: 1 }}>
            SARS deemed rate for 2024/25: R4.84/km. Only business travel is deductible under S11(a). Keep a logbook — SARS may request it.
          </Text>
        </View>

        {/* Controls */}
        <View style={{ marginHorizontal: space.md, marginTop: space.lg }}>
          {status === "idle" && (
            <TouchableOpacity onPress={handleStart} style={{ backgroundColor: colour.success, borderRadius: radius.pill, paddingVertical: space.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: space.sm }} activeOpacity={0.85}>
              <Text style={{ fontSize: 20 }}>▶</Text>
              <Text style={{ ...typography.actionL, color: colour.onPrimary }}>Start Trip</Text>
            </TouchableOpacity>
          )}

          {status === "running" && (
            <View style={{ gap: space.sm }}>
              <TouchableOpacity onPress={handlePause} style={{ backgroundColor: colour.warning, borderRadius: radius.pill, paddingVertical: space.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: space.sm }} activeOpacity={0.85}>
                <Text style={{ fontSize: 18 }}>⏸</Text>
                <Text style={{ ...typography.actionL, color: colour.onPrimary }}>Pause Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEnd} disabled={saving} style={{ backgroundColor: colour.white, borderRadius: radius.pill, paddingVertical: space.md, alignItems: "center", borderWidth: 2, borderColor: colour.danger, flexDirection: "row", justifyContent: "center", gap: space.sm }} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color={colour.danger} /> : (
                  <>
                    <Text style={{ fontSize: 18 }}>⏹</Text>
                    <Text style={{ ...typography.actionL, color: colour.danger }}>End & Save Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {status === "paused" && (
            <View style={{ gap: space.sm }}>
              <TouchableOpacity onPress={handleResume} style={{ backgroundColor: colour.primary, borderRadius: radius.pill, paddingVertical: space.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: space.sm }} activeOpacity={0.85}>
                <Text style={{ fontSize: 18 }}>▶</Text>
                <Text style={{ ...typography.actionL, color: colour.onPrimary }}>Resume Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEnd} disabled={saving} style={{ backgroundColor: colour.white, borderRadius: radius.pill, paddingVertical: space.md, alignItems: "center", borderWidth: 2, borderColor: colour.danger, flexDirection: "row", justifyContent: "center", gap: space.sm }} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color={colour.danger} /> : (
                  <>
                    <Text style={{ fontSize: 18 }}>⏹</Text>
                    <Text style={{ ...typography.actionL, color: colour.danger }}>End & Save Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Purpose modal */}
      <Modal visible={showPurpose} transparent animationType="slide" onRequestClose={() => setShowPurpose(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
          <View style={{ backgroundColor: colour.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: space.md, paddingBottom: space["3xl"], paddingTop: space.md }}>
            <View style={{ width: 40, height: 4, backgroundColor: colour.borderLight, borderRadius: radius.pill, alignSelf: "center", marginBottom: space.md }} />
            <Text style={{ ...typography.h4, color: colour.text, marginBottom: space.xs }}>Trip Purpose</Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub, marginBottom: space.md }}>Select the business purpose for SARS ITR12 compliance.</Text>

            {TRIP_PURPOSES.map((p) => (
              <TouchableOpacity key={p.key} onPress={() => setSelectedPurpose(p)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: space.sm, paddingHorizontal: space.sm, borderRadius: radius.md, backgroundColor: selectedPurpose.key === p.key ? colour.primary50 : "transparent", marginBottom: 4 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selectedPurpose.key === p.key ? colour.primary : colour.border, alignItems: "center", justifyContent: "center", marginRight: space.sm }}>
                  {selectedPurpose.key === p.key && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colour.primary }} />}
                </View>
                <Text style={{ ...typography.bodyM, color: colour.text, flex: 1 }}>{p.label}</Text>
                <Text style={{ ...typography.bodyXS, color: colour.textSub }}>{p.itr12}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ marginTop: space.md }}>
              <Text style={{ ...typography.bodyXS, color: colour.textSub, marginBottom: 4 }}>Note (optional)</Text>
              <TextInput
                value={tripNote}
                onChangeText={setTripNote}
                placeholder="e.g. Meeting at Sandton client office"
                placeholderTextColor={colour.textHint}
                style={{ borderBottomWidth: 1, borderBottomColor: colour.border, paddingVertical: space.xs, ...typography.bodyM, color: colour.text }}
              />
            </View>

            <TouchableOpacity onPress={confirmStart} style={{ backgroundColor: colour.success, borderRadius: radius.pill, paddingVertical: space.md, alignItems: "center", marginTop: space.lg, flexDirection: "row", justifyContent: "center", gap: space.sm }} activeOpacity={0.85}>
              <Text style={{ fontSize: 18 }}>▶</Text>
              <Text style={{ ...typography.actionL, color: colour.onPrimary }}>Start Tracking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MXTabBar />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OdometerDisplay({ km }: { km: number }) {
  const [whole, decimal] = km.toFixed(2).split(".");
  const paddedWhole = whole.padStart(5, "0");
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 2 }}>
      {paddedWhole.split("").map((d, i) => (
        <OdoDigit key={`w-${i}`} digit={d} dim={i < paddedWhole.length - Math.max(1, whole.length)} />
      ))}
      <Text style={{ fontSize: 28, fontWeight: "700", color: colour.textSub, marginBottom: 4, lineHeight: 36 }}>.</Text>
      {decimal.split("").map((d, i) => (
        <OdoDigit key={`d-${i}`} digit={d} small />
      ))}
    </View>
  );
}

function OdoDigit({ digit, dim, small }: { digit: string; dim?: boolean; small?: boolean }) {
  return (
    <View style={{ backgroundColor: dim ? colour.surface1 : colour.background, borderRadius: radius.sm, minWidth: small ? 28 : 36, height: small ? 44 : 56, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colour.borderLight, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 }, android: { elevation: 1 } }) }}>
      <Text style={{ fontSize: small ? 22 : 32, fontWeight: "700", color: dim ? colour.textHint : colour.primary, fontVariant: ["tabular-nums"], lineHeight: small ? 28 : 40 }}>{digit}</Text>
    </View>
  );
}

function StatPill({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: highlight ? colour.primary50 : colour.surface1, borderRadius: radius.md, padding: space.sm, alignItems: "center" }}>
      <Text style={{ fontSize: 14, marginBottom: 2 }}>{icon}</Text>
      <Text style={{ ...typography.bodyXS, color: highlight ? colour.primary : colour.textSub, textAlign: "center", fontWeight: highlight ? "700" : "400" }}>{value}</Text>
      <Text style={{ ...typography.captionM, color: colour.textHint, textAlign: "center", fontSize: 9 }}>{label}</Text>
    </View>
  );
}
