import { InfoBanner } from "@/components/InfoBanner";
import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { MXInput } from "@/components/MXInput";
import { MXTabBar } from "@/components/MXTabBar";
import { VehiclePicker } from "@/components/VehiclePicker";
import { FREE_MILEAGE_TRIP_LIMIT } from "@/constants/freeTier";
import { TRIP_PURPOSES } from "@/constants/tripPurposes";
import {
  displayDateToISO,
  formatDateInputDDMMYYYY,
  isoToDisplayDate,
  localISODate,
} from "@/lib/dateInput";
import { safeBack } from "@/lib/navigation";
import { taxYearForDate } from "@/lib/taxRules";
import { addressForCoords } from "@/lib/tripAddress";
import {
  firstError,
  MAX_ODOMETER_KM,
  validateDate,
  validateOdometer,
  validateTripPlace,
  validateTripReason,
} from "@/lib/validation";
import { mileageService, type MileageTrip } from "@/services/mileageService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { useVehicleStore, vehicleLabel } from "@/stores/vehicleStore";
import { colour, radius, space, typography } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Two modes:
// • No id: add a trip by hand (one that wasn't GPS-tracked). Date and
//   distance are entered, and the trip is saved with source "manual".
// • id: logbook details for a saved trip, mainly for filling in what SARS
//   needs (vehicle, from, to, reason) on trips captured before those fields
//   existed. A GPS trip's date and distance come from the GPS and can't be
//   edited; a manual trip's can.
export default function MileageTripEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id;
  const { user, isPremium } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();
  const { vehicles, load: loadVehicles } = useVehicleStore();

  const [trip, setTrip] = useState<MileageTrip | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [tripDate, setTripDate] = useState(isNew ? isoToDisplayDate(localISODate(new Date())) : "");
  const [distance, setDistance] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [purpose, setPurpose] = useState(isNew ? TRIP_PURPOSES[0].label : "");
  const [odoStart, setOdoStart] = useState("");
  const [odoEnd, setOdoEnd] = useState("");
  const [suggested, setSuggested] = useState({ from: false, to: false });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);

  const isManual = isNew || trip?.source === "manual";

  useEffect(() => {
    if (user) loadVehicles(user.id, activeTaxYear).catch(() => {});
  }, [user, activeTaxYear]);

  // New trip: default to the only / most recently added vehicle in use.
  const active = vehicles.filter((v) => !v.isArchived);
  useEffect(() => {
    if (isNew && !vehicleId && active.length) setVehicleId(active[active.length - 1].id);
  }, [isNew, active.length]);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const t = await mileageService.getTrip(id, user.id);
        if (!t) return;
        setTrip(t);
        setVehicleId(t.vehicle_id);
        setTripDate(isoToDisplayDate(t.trip_date));
        setDistance(String(Number(t.distance_km)));
        setFrom(t.start_address ?? "");
        setTo(t.end_address ?? "");
        setReason(t.notes ?? "");
        setPurpose(t.purpose);
        setOdoStart(t.odometer_start != null ? String(t.odometer_start) : "");
        setOdoEnd(t.odometer_end != null ? String(t.odometer_end) : "");
        setLoading(false);

        // Suggest From/To from the GPS points already saved on the trip, so
        // backfilling an old trip is usually just a check rather than typing.
        const [start, end] = await Promise.all([
          t.start_address ? null : addressForCoords(t.start_lat, t.start_lng),
          t.end_address ? null : addressForCoords(t.end_lat, t.end_lng),
        ]);
        if (start) setFrom((cur) => cur || start);
        if (end) setTo((cur) => cur || end);
        setSuggested({ from: !!start, to: !!end });
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  // Manual trips: fill the distance from the odometer readings when both are
  // given and the distance hasn't been typed.
  const odoDistance =
    odoStart.trim() && odoEnd.trim() && Number(odoEnd) >= Number(odoStart)
      ? Number(odoEnd) - Number(odoStart)
      : null;
  const effectiveDistance = distance.trim() ? Number(distance) : odoDistance;

  // Only offer active vehicles, plus the trip's own vehicle if it's since
  // been archived, so the current assignment still shows as selected.
  const pickable = vehicles.filter((v) => !v.isArchived || v.id === trip?.vehicle_id);
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const validate = () => {
    const next: Record<string, string | null> = {
      vehicle: vehicleId ? null : "Choose the vehicle used for this trip.",
      from: validateTripPlace(from, "From"),
      to: validateTripPlace(to, "To"),
      reason: validateTripReason(reason),
      odoStart: validateOdometer(odoStart, "Start reading"),
      odoEnd: validateOdometer(odoEnd, "End reading"),
    };
    if (!next.odoStart && !next.odoEnd && odoStart.trim() && odoEnd.trim() && Number(odoEnd) < Number(odoStart)) {
      next.odoEnd = "The end reading can't be lower than the start reading.";
    }
    if (isManual) {
      const iso = displayDateToISO(tripDate);
      next.tripDate = validateDate(iso, { fieldName: "Trip date" });
      // A trip can only be on a vehicle you owned at the time.
      if (!next.tripDate && selectedVehicle?.acquiredDate && iso < selectedVehicle.acquiredDate) {
        next.tripDate = `You bought this vehicle on ${isoToDisplayDate(selectedVehicle.acquiredDate)}.`;
      }
      if (!next.tripDate && selectedVehicle?.soldDate && iso > selectedVehicle.soldDate) {
        next.tripDate = `You sold this vehicle on ${isoToDisplayDate(selectedVehicle.soldDate)}.`;
      }
      if (effectiveDistance == null || isNaN(effectiveDistance) || effectiveDistance <= 0) {
        next.distance = "Enter the distance, or the start and end km readings.";
      } else if (effectiveDistance > MAX_ODOMETER_KM) {
        next.distance = "That distance looks too high.";
      }
    }
    setErrors(next);
    return firstError(...Object.values(next));
  };

  const handleSave = async () => {
    if (!user) return;
    const error = validate();
    if (error) {
      Alert.alert("Logbook details needed", error);
      return;
    }
    setSaving(true);
    try {
      const details = {
        vehicle_id: vehicleId,
        start_address: from.trim(),
        end_address: to.trim(),
        notes: reason.trim(),
        purpose,
        odometer_start: odoStart.trim() ? Number(odoStart) : null,
        odometer_end: odoEnd.trim() ? Number(odoEnd) : null,
      };
      const iso = displayDateToISO(tripDate);
      const taxYear = isManual ? taxYearForDate(iso) : trip!.tax_year;
      const km = parseFloat(Number(effectiveDistance).toFixed(3));

      if (isNew) {
        // Same free-tier cap as GPS trips. Fails open on a count error, like
        // the tracker, so a network blip doesn't block logging.
        if (!isPremium) {
          const count = await mileageService.countThisMonth(user.id).catch(() => null);
          if (count !== null && count >= FREE_MILEAGE_TRIP_LIMIT) {
            Alert.alert(
              "Monthly trip limit reached",
              `Free accounts can log ${FREE_MILEAGE_TRIP_LIMIT} trips a month. Upgrade to Pro for unlimited trips.`,
              [
                { text: "Not now", style: "cancel" },
                { text: "Upgrade", onPress: () => router.push("/paywall-upgrade" as any) },
              ],
            );
            return;
          }
        }
        await mileageService.createTrip(user.id, {
          ...details,
          trip_date: iso,
          tax_year: taxYear,
          distance_km: km,
          duration_seconds: 0,
          start_lat: null,
          start_lng: null,
          end_lat: null,
          end_lng: null,
          source: "manual",
        });
      } else {
        await mileageService.updateTripDetails(
          trip!.id,
          user.id,
          isManual ? { ...details, trip_date: iso, tax_year: taxYear, distance_km: km } : details,
        );
      }

      // Business km (and moving a trip between vehicles or tax years) change
      // each affected vehicle's business-use % and wear & tear.
      const years = new Set([taxYear, trip?.tax_year].filter((y): y is string => !!y));
      for (const ty of years) await useVehicleStore.getState().syncWearAndTear(user.id, ty);
      safeBack(router, "/mileage-history");
    } catch (e: any) {
      Alert.alert("Save failed", e.message ?? "Could not save this trip. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const purposeOptions = TRIP_PURPOSES.some((p) => p.label === purpose) || !purpose
    ? TRIP_PURPOSES.map((p) => p.label)
    : [purpose, ...TRIP_PURPOSES.map((p) => p.label)];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title={isNew ? "Add a trip" : "Trip details"}
        subtitle={
          isNew
            ? "Add a trip you didn't track"
            : trip
              ? `${isoToDisplayDate(trip.trip_date)} · ${Number(trip.distance_km).toFixed(2)} km${isManual ? " · manual" : ""}`
              : undefined
        }
        showBack
      />

      {!isNew && (loading || !trip) ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {loading ? (
            <ActivityIndicator color={colour.primary} size="large" />
          ) : (
            <Text style={{ ...typography.bodyM, color: colour.textSub }}>Trip not found.</Text>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <InfoBanner
              icon="car.fill"
              title="What SARS needs"
              body={
                isNew
                  ? "For a work trip you didn't track with GPS. SARS needs the date, the distance, the vehicle, where you drove from and to, and why."
                  : "For every work trip, SARS needs the vehicle, where you drove from and to, and why."
              }
              style={{ marginBottom: space.xl }}
            />

            {/* ── Vehicle ───────────────────────────────────────────── */}
            <Text style={{ ...typography.labelM, color: errors.vehicle ? colour.danger : colour.textSub, marginBottom: space.sm }}>
              VEHICLE
            </Text>
            <View
              style={{
                backgroundColor: colour.white,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: errors.vehicle ? colour.danger : colour.borderLight,
                padding: space.xs,
                marginBottom: space.xl,
              }}
            >
              <VehiclePicker
                vehicles={pickable}
                selectedId={vehicleId}
                onSelect={setVehicleId}
                onAddVehicle={() => router.push("/vehicle-form")}
              />
            </View>

            {/* ── Date & distance (manual trips only) ───────────────── */}
            {isManual && (
              <>
                <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
                  DATE & DISTANCE
                </Text>
                <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.xl }}>
                  <View style={{ flex: 1 }}>
                    <MXInput
                      label="Trip date"
                      value={tripDate}
                      onChangeText={(t) => setTripDate(formatDateInputDDMMYYYY(t))}
                      placeholder="DD/MM/YYYY"
                      keyboardType="number-pad"
                      error={errors.tripDate ?? undefined}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MXInput
                      label="Distance (km)"
                      value={distance}
                      onChangeText={setDistance}
                      placeholder={odoDistance != null ? String(odoDistance) : "e.g. 42"}
                      keyboardType="decimal-pad"
                      hint={!distance.trim() && odoDistance != null ? "Worked out from your km readings" : undefined}
                      error={errors.distance ?? undefined}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ── Route & reason ────────────────────────────────────── */}
            <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
              TRAVEL DETAILS
            </Text>
            <View style={{ gap: space.md, marginBottom: space.xl }}>
              <MXInput
                label="From"
                value={from}
                onChangeText={setFrom}
                placeholder="e.g. 12 Main Rd, Randburg"
                hint={suggested.from ? "We filled this in from where the trip started. Please check it." : undefined}
                error={errors.from ?? undefined}
              />
              <MXInput
                label="To"
                value={to}
                onChangeText={setTo}
                placeholder="e.g. ABC Ltd, Sandton"
                hint={suggested.to ? "We filled this in from where the trip ended. Please check it." : undefined}
                error={errors.to ?? undefined}
              />
              <MXInput
                label="Why you went"
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Site meeting with ABC Ltd re: fit-out quote"
                multiline
                error={errors.reason ?? undefined}
              />
            </View>

            {/* ── Category ──────────────────────────────────────────── */}
            <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
              CATEGORY
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginBottom: space.xl }}>
              {purposeOptions.map((label) => {
                const selected = label === purpose;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setPurpose(label)}
                    style={{
                      backgroundColor: selected ? colour.primary : colour.white,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: selected ? colour.primary : colour.border,
                      paddingHorizontal: space.md,
                      paddingVertical: space.xs,
                    }}
                  >
                    <Text style={{ ...typography.actionS, color: selected ? colour.onPrimary : colour.text }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Odometer (optional) ───────────────────────────────── */}
            <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
              KM READINGS (OPTIONAL)
            </Text>
            <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.xl }}>
              <View style={{ flex: 1 }}>
                <MXInput
                  label="Start (km)"
                  value={odoStart}
                  onChangeText={setOdoStart}
                  keyboardType="decimal-pad"
                  error={errors.odoStart ?? undefined}
                />
              </View>
              <View style={{ flex: 1 }}>
                <MXInput
                  label="End (km)"
                  value={odoEnd}
                  onChangeText={setOdoEnd}
                  keyboardType="decimal-pad"
                  error={errors.odoEnd ?? undefined}
                />
              </View>
            </View>

            <MXButton
              label={saving ? "Saving…" : isNew ? "Add trip to logbook" : "Save trip details"}
              variant="primary"
              size="L"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              fullWidth
            />
            {isNew && selectedVehicle && (
              <Text style={{ ...typography.bodyXS, color: colour.textSub, textAlign: "center", marginTop: space.sm }}>
                Logging to {vehicleLabel(selectedVehicle)}
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <MXTabBar />
    </SafeAreaView>
  );
}
