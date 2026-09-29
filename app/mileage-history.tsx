import { AnnouncementModal } from "@/components/AnnouncementModal";
import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { NoteCard, SectionEyebrow } from "@/components/MXSection";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useNotice } from "@/components/useNotice";
import { VehiclePicker } from "@/components/VehiclePicker";
import { FREE_LOGBOOK_EXPORT_LIMIT } from "@/constants/freeTier";
import { useAppForeground } from "@/hooks/use-app-foreground";
import { claimsVehicleCostsAsBusiness, EMPLOYEE_VEHICLE_NOTE } from "@/lib/workType";
import { logbookExportService } from "@/services/logbookExportService";
import {
  mileageService,
  missingLogbookFields,
  type MileageTrip,
} from "@/services/mileageService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { activeVehicles, logbookBusinessUse, useVehicleStore, vehicleLabel } from "@/stores/vehicleStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const fmtKm = (n: number) => `${n.toLocaleString("en-ZA", { maximumFractionDigits: 1 })} km`;

export default function MileageHistoryScreen() {
  const router = useRouter();
  const { user, isPremium } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();
  const { notice, showNotice } = useNotice();

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const { vehicles, readings, load: loadVehicles } = useVehicleStore();
  const tripVehicles = activeVehicles(vehicles);
  const [showAssign, setShowAssign] = useState(false);
  const [assignVehicleId, setAssignVehicleId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);

  const loadTrips = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [data, profile] = await Promise.all([
        mileageService.getTrips(user.id, activeTaxYear),
        profileService.getProfile(user.id).catch(() => null),
        loadVehicles(user.id, activeTaxYear, true).catch(() => {}),
      ]);
      setIsEmployee(!claimsVehicleCostsAsBusiness(profile?.work_type));
      setTrips(data);
      // Trips feed the business-use % behind the wear & tear claim.
      useVehicleStore.getState().syncWearAndTear(user.id, activeTaxYear);
    } catch (e: any) {
      console.error("MileageHistory load error:", e);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeTaxYear]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips]),
  );
  useAppForeground(loadTrips);

  // ── Logbook completeness (backfill for trips logged before vehicles) ─────
  const incompleteTrips = trips.filter((t) => missingLogbookFields(t).length > 0);
  const unassignedCount = trips.filter((t) => !t.vehicle_id).length;
  const vehiclesMissingOpening = tripVehicles.filter((v) => readings[v.id]?.openingKm == null);
  const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  const showLogbookCard =
    incompleteTrips.length > 0 ||
    vehiclesMissingOpening.length > 0 ||
    (trips.length > 0 && tripVehicles.length === 0);

  const openAssign = () => {
    setAssignVehicleId(tripVehicles.length ? tripVehicles[0].id : null);
    setShowAssign(true);
  };

  const confirmAssign = async () => {
    if (!user || !assignVehicleId) return;
    setAssigning(true);
    try {
      await mileageService.assignVehicleToUnassignedTrips(user.id, assignVehicleId, activeTaxYear);
      setShowAssign(false);
      await loadTrips();
    } catch {
      setShowAssign(false);
      showNotice({
        title: "Couldn't link your trips",
        message: "Please check your internet connection and try again.",
      });
    } finally {
      setAssigning(false);
    }
  };

  // ── Logbook export — free-tier gated like the ITR12 export ──────────────
  // Fails open on a count-check error, same as the ITR12 export.
  const openExport = async () => {
    if (!user) return;
    if (!isPremium) {
      const count = await logbookExportService.countThisMonth(user.id).catch(() => null);
      if (count !== null && count >= FREE_LOGBOOK_EXPORT_LIMIT) {
        showNotice({
          title: "You've used this month's exports",
          message: `Free accounts can export the logbook ${FREE_LOGBOOK_EXPORT_LIMIT} times a month. Upgrade to Pro to export as often as you like.`,
          icon: "crown.fill",
          confirmLabel: "Upgrade to Pro",
          cancelLabel: "Not now",
          onConfirm: () => router.push("/paywall-upgrade" as any),
        });
        return;
      }
    }
    setShowExport(true);
  };

  const runExport = async (format: "pdf" | "csv") => {
    if (!user) return;
    setShowExport(false);
    setExporting(true);
    try {
      if (format === "pdf") await logbookExportService.exportPDF(user.id, activeTaxYear);
      else await logbookExportService.exportCSV(user.id, activeTaxYear);
      await logbookExportService.logExport(user.id).catch((e) => console.warn("logExport failed:", e.message));
    } catch {
      showNotice({ title: "Couldn't export your logbook", message: "Please try again." });
    } finally {
      setExporting(false);
    }
  };

  // Totals. No rand value per km: a self-employed (s11(a)) vehicle claim is
  // actual costs × business-use %, so the logbook's job is the % itself:
  // business km ÷ odometer total km.
  const totalKm = trips.reduce((s, t) => s + Number(t.distance_km), 0);
  const workUse = logbookBusinessUse(trips, readings);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Trip logbook"
        subtitle={`Tax year ${activeTaxYear}`}
        showBack
        right={
          <TouchableOpacity
            onPress={() => router.push("/mileage-tracker")}
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
            }}
          >
            <Text style={{ ...typography.chipText, color: colour.accentDeep }}>+ Track a trip</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats hero (same build as expense-history) ────────────────── */}
        <View
          style={{
            backgroundColor: colour.heroDark,
            borderRadius: radius.hero,
            padding: space.lg,
            marginBottom: space.lg,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1.2 }}>
              <Text style={{ ...typography.statLabel, color: colour.onNoir2, textTransform: "uppercase" }}>
                Work km
              </Text>
              <Text
                style={{ ...typography.statValue, color: colour.onNoir, marginTop: 6 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {fmtKm(totalKm)}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.14)" }} />
            <View style={{ flex: 1, paddingLeft: space.md }}>
              <Text style={{ ...typography.statLabel, color: colour.onNoir2, textTransform: "uppercase" }}>
                Work use
              </Text>
              <Text style={{ ...typography.statValue, color: colour.brandTeal, marginTop: 6 }}>
                {workUse ? `${(workUse.ratio * 100).toFixed(0)}%` : "—"}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.14)" }} />
            <View style={{ flex: 0.7, paddingLeft: space.md }}>
              <Text style={{ ...typography.statLabel, color: colour.onNoir2, textTransform: "uppercase" }}>
                Trips
              </Text>
              <Text style={{ ...typography.statValue, color: colour.onNoir, marginTop: 6 }}>{trips.length}</Text>
            </View>
          </View>
        </View>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: space.sm, marginBottom: space.md }}>
          {[
            { label: "Add a trip", icon: "plus.circle.fill", onPress: () => router.push("/mileage-trip-edit") },
            { label: exporting ? "Exporting…" : "Export logbook", icon: "square.and.arrow.up", onPress: openExport },
          ].map((b) => (
            <TouchableOpacity
              key={b.icon}
              onPress={b.onPress}
              disabled={exporting}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
                backgroundColor: colour.bgCard,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colour.borderLight,
                paddingVertical: space.md,
                paddingHorizontal: space.md,
              }}
            >
              <IconSymbol name={b.icon as any} size={16} color={colour.accentDeep} />
              <Text style={{ ...typography.mTbtn, color: colour.text }}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Vehicles ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/vehicles")}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colour.bgCard,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colour.border,
            paddingHorizontal: space.lg,
            paddingVertical: space.md,
            marginBottom: space.lg,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colour.primaryLight,
              alignItems: "center",
              justifyContent: "center",
              marginRight: space.md,
            }}
          >
            <IconSymbol name="car.fill" size={18} color={colour.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.itemTitle, color: colour.textPrimary }}>Vehicles & km readings</Text>
            <Text style={{ ...typography.itemSub, color: colour.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {tripVehicles.length === 0
                ? "Add the vehicle you use for work"
                : tripVehicles.map(vehicleLabel).join(" · ")}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={14} color={colour.textHint} />
        </TouchableOpacity>

        {/* ── Logbook incomplete (backfill for trips logged before vehicles) ── */}
        {!loading && showLogbookCard && (
          <View
            style={{
              backgroundColor: colour.heroDark,
              borderRadius: radius.card,
              padding: space.md,
              marginBottom: space.lg,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.xs }}>
              <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colour.warning} />
              <Text style={{ ...typography.labelS, color: colour.onNoir }}>Your logbook isn't finished</Text>
            </View>
            <Text style={{ ...typography.noteText, color: colour.onNoir2 }}>
              {incompleteTrips.length > 0
                ? `${incompleteTrips.length} of ${trips.length} trip${trips.length === 1 ? " is" : "s are"} missing details SARS needs. Tap a trip to add the vehicle, where you drove from and to, and why.`
                : "Your trips are complete. SARS also needs your start and end of year km readings for each vehicle."}
            </Text>

            {unassignedCount > 0 && (
              <TouchableOpacity
                onPress={tripVehicles.length === 0 ? () => router.push("/vehicle-form") : openAssign}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colour.primary,
                  borderRadius: radius.pill,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: space.md,
                }}
              >
                <Text style={{ ...typography.mBtn, color: colour.onPrimary }} numberOfLines={1}>
                  {tripVehicles.length === 0
                    ? "Add your vehicle"
                    : `Choose the vehicle for ${unassignedCount} trip${unassignedCount === 1 ? "" : "s"}`}
                </Text>
              </TouchableOpacity>
            )}

            {vehiclesMissingOpening.map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => router.push({ pathname: "/vehicle-form", params: { id: v.id } })}
                style={{ flexDirection: "row", alignItems: "center", marginTop: space.md }}
              >
                <Text style={{ ...typography.noteText, color: colour.onNoir, flex: 1 }}>
                  Start-of-year km reading missing for {vehicleLabel(v)}
                </Text>
                <Text style={{ ...typography.chipText, color: colour.primary200 }}>Add →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Trips ─────────────────────────────────────────────────────── */}
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["3xl"] }}>
            <ActivityIndicator color={colour.primary} />
          </View>
        ) : trips.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: space["2xl"], paddingHorizontal: space.lg }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colour.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: space.md,
              }}
            >
              <IconSymbol name="car.fill" size={28} color={colour.primary} />
            </View>
            <Text style={{ ...typography.cardTitle, color: colour.textPrimary }}>No trips yet</Text>
            <Text
              style={{
                ...typography.mSub,
                color: colour.textSecondary,
                textAlign: "center",
                marginTop: space.xs,
                marginBottom: space.xl,
              }}
            >
              Track your work trips so you can claim for your vehicle.
            </Text>
            <MXButton label="Track your first trip" variant="primary" size="L" onPress={() => router.push("/mileage-tracker")} fullWidth />
            <TouchableOpacity onPress={() => router.push("/mileage-trip-edit")} style={{ marginTop: space.md }}>
              <Text style={{ ...typography.mTbtn, color: colour.primary }}>Or add a past trip by hand</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SectionEyebrow>All trips</SectionEyebrow>
            <View
              style={{
                backgroundColor: colour.bgCard,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colour.border,
                paddingHorizontal: space.lg,
                marginBottom: space.xl,
              }}
            >
              {trips.map((trip, i) => {
                const missing = missingLogbookFields(trip);
                const vehicle = trip.vehicle_id ? vehicleById[trip.vehicle_id] : undefined;
                const place =
                  trip.start_address || trip.end_address
                    ? `${trip.start_address ?? "?"} → ${trip.end_address ?? "?"}`
                    : null;
                return (
                  <TouchableOpacity
                    key={trip.id}
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: "/mileage-trip-edit", params: { id: trip.id } })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: space.md,
                      borderBottomWidth: i < trips.length - 1 ? 1 : 0,
                      borderBottomColor: colour.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colour.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: space.md,
                      }}
                    >
                      <IconSymbol name={trip.source === "manual" ? "pencil" : "car.fill"} size={18} color={colour.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.itemTitle, color: colour.textPrimary }} numberOfLines={1}>
                        {trip.notes?.trim() || trip.purpose}
                      </Text>
                      <Text style={{ ...typography.itemSub, color: colour.textSecondary, marginTop: 2 }} numberOfLines={1}>
                        {formatDate(trip.trip_date)}
                        {vehicle ? ` · ${vehicle.registration}` : ""}
                        {trip.source === "manual" ? " · added by hand" : ""}
                      </Text>
                      {place && (
                        <Text style={{ ...typography.itemSub, color: colour.textSecondary, marginTop: 2 }} numberOfLines={1}>
                          {place}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 5, marginLeft: space.sm }}>
                      <Text style={{ ...typography.itemAmount, color: colour.textPrimary }}>
                        {fmtKm(Number(trip.distance_km))}
                      </Text>
                      {missing.length > 0 && (
                        <View
                          style={{
                            backgroundColor: colour.warningBg,
                            borderRadius: radius.full,
                            paddingHorizontal: space.sm,
                            paddingVertical: 3,
                          }}
                        >
                          <Text style={{ ...typography.chipText, color: colour.text }}>Needs details</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <NoteCard
              icon="car.fill"
              title="What SARS needs in your logbook"
              body={`For each work trip: the date, the km, where you drove from and to, and why. For each vehicle: the km on your dashboard at the start and end of the tax year. ${isEmployee ? EMPLOYEE_VEHICLE_NOTE : "We compare your work km to all the km you drove, and you claim that share of your vehicle costs."} Driving between home and your usual workplace doesn't count as work travel.`}
            />
          </>
        )}
      </ScrollView>

      {notice}

      <AnnouncementModal
        visible={showExport}
        icon="square.and.arrow.up"
        eyebrow={`Tax year ${activeTaxYear}`}
        title="Export your logbook"
        subtitle="Set out the way SARS asks for it: each vehicle's km readings, then every work trip with its date, km, where you drove from and to, and why."
        primaryLabel="Export PDF"
        onPrimary={() => runExport("pdf")}
        secondaryLabel="Export CSV (spreadsheet)"
        onSecondary={() => runExport("csv")}
        onClose={() => setShowExport(false)}
      />

      {/* Link trips logged before vehicles existed — app bottom sheet */}
      <AnnouncementModal
        visible={showAssign}
        icon="car.fill"
        eyebrow={`Tax year ${activeTaxYear}`}
        title="Which vehicle did you use?"
        subtitle={`All ${unassignedCount} trip${unassignedCount === 1 ? "" : "s"} with no vehicle will be linked to the one you pick. You can still change a single trip later.`}
        primaryLabel={assigning ? "Linking…" : "Link trips"}
        onPrimary={() => {
          if (!assigning) confirmAssign();
        }}
        secondaryLabel="Cancel"
        onClose={() => setShowAssign(false)}
      >
        <VehiclePicker
          vehicles={tripVehicles}
          selectedId={assignVehicleId}
          onSelect={setAssignVehicleId}
          onAddVehicle={() => {
            // Close the sheet first — a native Modal stays on top of the
            // pushed screen otherwise.
            setShowAssign(false);
            router.push("/vehicle-form");
          }}
        />
      </AnnouncementModal>

      <MXTabBar />
    </SafeAreaView>
  );
}
