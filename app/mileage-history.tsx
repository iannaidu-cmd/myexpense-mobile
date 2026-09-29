import { AnnouncementModal } from "@/components/AnnouncementModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FREE_LOGBOOK_EXPORT_LIMIT } from "@/constants/freeTier";
import { logbookExportService } from "@/services/logbookExportService";
import { InfoBanner } from "@/components/InfoBanner";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehiclePicker } from "@/components/VehiclePicker";
import {
    mileageService,
    missingLogbookFields,
    type MileageTrip,
} from "@/services/mileageService";

import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { claimsVehicleCostsAsBusiness, EMPLOYEE_VEHICLE_NOTE } from "@/lib/workType";
import { profileService } from "@/services/profileService";
import { activeVehicles, logbookBusinessUse, useVehicleStore, vehicleLabel } from "@/stores/vehicleStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppForeground } from "@/hooks/use-app-foreground";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


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

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


export default function MileageHistoryScreen() {
  const router = useRouter();
  const { user, isPremium } = useAuthStore();
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { activeTaxYear } = useExpenseStore();

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { vehicles, readings, load: loadVehicles } = useVehicleStore();
  const tripVehicles = activeVehicles(vehicles);
  const [showAssign, setShowAssign] = useState(false);
  const [assignVehicleId, setAssignVehicleId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
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
    } catch (e: any) {
      Alert.alert("Error", e.message);
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
        Alert.alert(
          "Monthly export limit reached",
          `Free accounts can export the logbook ${FREE_LOGBOOK_EXPORT_LIMIT} times a month. Upgrade to Pro for unlimited exports.`,
          [
            { text: "Not now", style: "cancel" },
            { text: "Upgrade", onPress: () => router.push("/paywall-upgrade" as any) },
          ],
        );
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
    } catch (e: any) {
      Alert.alert("Export failed", e.message ?? "Could not export your logbook. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = (id: string) => setConfirmDeleteId(id);

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeleting(id);
    try {
      await mileageService.deleteTrip(id, user!.id);
      await loadTrips();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setDeleting(null);
    }
  };

  // Totals. No rand value per km: a self-employed (s11(a)) vehicle claim is
  // actual costs × business-use %, so the logbook's job is the % itself:
  // business km ÷ odometer total km.
  const totalKm = trips.reduce((s, t) => s + Number(t.distance_km), 0);
  const totalTrips = trips.length;
  const businessUse = logbookBusinessUse(trips, readings);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Trip logbook"
        subtitle={`Tax Year ${activeTaxYear}`}
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
            <Text style={{ ...typography.actionS, color: colour.accentDeep }}>
              + New Trip
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.bgPage,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats hero */}
        <View
          style={{
            backgroundColor: colour.noir,
            borderRadius: radius.lg,
            padding: space.lg,
            marginBottom: space.lg,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1.1 }}>
              <Text style={{ ...typography.caption, color: colour.onNoir2 }}>
                Total distance
              </Text>
              <Text
                style={{ ...typography.amountM, color: colour.onNoir, marginTop: 2 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {totalKm.toFixed(1)} km
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.14)" }} />
            <View style={{ flex: 1, paddingLeft: space.md }}>
              <Text style={{ ...typography.caption, color: colour.onNoir2 }}>
                Work use
              </Text>
              <Text
                style={{ ...typography.amountM, color: colour.brandTeal, marginTop: 2 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {businessUse ? `${(businessUse.ratio * 100).toFixed(0)}%` : "—"}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.14)" }} />
            <View style={{ flex: 0.7, paddingLeft: space.md }}>
              <Text style={{ ...typography.caption, color: colour.onNoir2 }}>
                Trips
              </Text>
              <Text style={{ ...typography.amountM, color: colour.onNoir, marginTop: 2 }}>
                {totalTrips}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicles */}
        <TouchableOpacity
          onPress={() => router.push("/vehicles")}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colour.white,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colour.border,
            padding: space.md,
            marginBottom: space.lg,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.sm,
              backgroundColor: colour.primary50,
              alignItems: "center",
              justifyContent: "center",
              marginRight: space.md,
            }}
          >
            <IconSymbol name="car.fill" size={15} color={colour.accentDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.labelM, color: colour.textPrimary }}>Vehicles & km readings</Text>
            <Text style={{ ...typography.caption, color: colour.textSecondary }} numberOfLines={1}>
              {tripVehicles.length === 0
                ? "Add the vehicle you use for business"
                : tripVehicles.map(vehicleLabel).join(" · ")}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colour.textHint} />
        </TouchableOpacity>

        {/* Add a trip by hand / export the logbook */}
        <View style={{ flexDirection: "row", gap: space.sm, marginBottom: space.lg }}>
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
                backgroundColor: colour.white,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colour.border,
                padding: space.md,
              }}
            >
              <IconSymbol name={b.icon as any} size={16} color={colour.accentDeep} />
              <Text style={{ ...typography.labelS, color: colour.textPrimary }}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logbook completeness — backfill for trips logged before vehicles */}
        {!loading && showLogbookCard && (
          <View
            style={{
              backgroundColor: colour.noir,
              borderRadius: radius.lg,
              padding: space.lg,
              marginBottom: space.lg,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.xs }}>
              <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colour.warning} />
              <Text style={{ ...typography.labelM, color: colour.onNoir }}>Logbook incomplete</Text>
            </View>
            <Text style={{ ...typography.bodyXS, color: colour.onNoir2, lineHeight: 17 }}>
              {incompleteTrips.length > 0
                ? `${incompleteTrips.length} of ${trips.length} trip${trips.length === 1 ? " is" : "s are"} missing details SARS needs. Tap a trip to add the vehicle, where you drove from and to, and why.`
                : "Your trips are complete. SARS also needs your start and end of year km readings for each vehicle."}
            </Text>

            {unassignedCount > 0 && (
              <TouchableOpacity
                onPress={tripVehicles.length === 0 ? () => router.push("/vehicle-form") : openAssign}
                style={{
                  backgroundColor: colour.primary,
                  borderRadius: radius.pill,
                  paddingVertical: space.sm,
                  paddingHorizontal: space.md,
                  alignItems: "center",
                  marginTop: space.md,
                }}
              >
                <Text style={{ ...typography.actionS, color: colour.onPrimary }} numberOfLines={1}>
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
                <Text style={{ ...typography.bodyXS, color: colour.onNoir, flex: 1 }}>
                  Start-of-year km reading missing for {vehicleLabel(v)}
                </Text>
                <Text style={{ ...typography.actionS, color: colour.primary100 }}>Add →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : trips.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <IconSymbol name="car.fill" size={48} color={colour.textHint} style={{ marginBottom: space.md } as any} />
            <Text style={{ ...typography.h4, color: colour.textPrimary }}>
              No trips yet
            </Text>
            <Text
              style={{
                ...typography.bodyM,
                color: colour.textSecondary,
                textAlign: "center",
                marginTop: space.xs,
                marginBottom: space.xl,
              }}
            >
              Start tracking your business travel for SARS ITR12 deductions
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/mileage-tracker")}
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                paddingVertical: space.md,
                paddingHorizontal: space.xl,
              }}
            >
              <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
                Start First Trip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/mileage-trip-edit")} style={{ marginTop: space.md }}>
              <Text style={{ ...typography.actionS, color: colour.primary }}>Or add a past trip by hand</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text
              style={{
                ...typography.labelM,
                color: colour.textSecondary,
                marginBottom: space.sm,
              }}
            >
              ALL TRIPS
            </Text>
            {trips.map((trip) => {
              const missing = missingLogbookFields(trip);
              const vehicle = trip.vehicle_id ? vehicleById[trip.vehicle_id] : undefined;
              return (
              <TouchableOpacity
                key={trip.id}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/mileage-trip-edit", params: { id: trip.id } })}
                style={{
                  backgroundColor: colour.white,
                  borderRadius: radius.lg,
                  padding: space.lg,
                  marginBottom: space.md,
                  borderWidth: 1,
                  borderColor: colour.border,
                  ...platformShadow,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: space.sm,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: colour.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: space.md,
                    }}
                  >
                    <IconSymbol name="car.fill" size={22} color={colour.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.labelM,
                        color: colour.textPrimary,
                      }}
                    >
                      {trip.purpose}
                    </Text>
                    <Text
                      style={{
                        ...typography.caption,
                        color: colour.textSecondary,
                      }}
                    >
                      {formatDate(trip.trip_date)} ·{" "}
                      {trip.source === "manual" ? "Added manually" : formatElapsed(trip.duration_seconds)}
                      {vehicle ? ` · ${vehicleLabel(vehicle)}` : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{ ...typography.labelM, color: colour.primary }}
                    >
                      {Number(trip.distance_km).toFixed(2)} km
                    </Text>
                    <Text
                      style={{ ...typography.caption, color: colour.accentDeep }}
                    >
                      {trip.source === "manual" ? "Manual" : "GPS"}
                    </Text>
                  </View>
                </View>

                {/* Detail row */}
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: colour.bgPage,
                    borderRadius: radius.sm,
                    padding: space.sm,
                    marginBottom: space.sm,
                  }}
                >
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        ...typography.micro,
                        color: colour.textSecondary,
                      }}
                    >
                      Distance
                    </Text>
                    <Text
                      style={{
                        ...typography.labelS,
                        color: colour.textPrimary,
                      }}
                    >
                      {Number(trip.distance_km).toFixed(2)} km
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      borderLeftWidth: 1,
                      borderRightWidth: 1,
                      borderColor: colour.border,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.micro,
                        color: colour.textSecondary,
                      }}
                    >
                      Duration
                    </Text>
                    <Text
                      style={{
                        ...typography.labelS,
                        color: colour.textPrimary,
                      }}
                    >
                      {trip.source === "manual" ? "—" : formatElapsed(trip.duration_seconds)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        ...typography.micro,
                        color: colour.textSecondary,
                      }}
                    >
                      Vehicle
                    </Text>
                    <Text
                      style={{ ...typography.labelS, color: colour.accentDeep }}
                      numberOfLines={1}
                    >
                      {vehicle?.registration ?? "—"}
                    </Text>
                  </View>
                </View>

                {(trip.start_address || trip.end_address) && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <IconSymbol name="mappin" size={12} color={colour.textSub} />
                    <Text style={{ ...typography.bodyXS, color: colour.textPrimary, flex: 1 }} numberOfLines={2}>
                      {trip.start_address ?? "?"} → {trip.end_address ?? "?"}
                    </Text>
                  </View>
                )}

                {trip.notes && (
                  <Text
                    style={{
                      ...typography.bodyXS,
                      color: colour.textSecondary,
                      marginBottom: space.sm,
                    }}
                  >
                    {trip.notes}
                  </Text>
                )}

                {/* ITR12 badge + delete */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {missing.length > 0 ? (
                    <View
                      style={{
                        backgroundColor: colour.warningBg,
                        borderRadius: radius.pill,
                        paddingHorizontal: space.sm,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ ...typography.micro, color: colour.text, fontWeight: "700" }}>
                        Needs {missing.join(", ")}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor: colour.primaryLight,
                        borderRadius: radius.pill,
                        paddingHorizontal: space.sm,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.micro,
                          color: colour.primary,
                          fontWeight: "700",
                        }}
                      >
                        S11(a) · ITR12 Deductible
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(trip.id)}
                    disabled={deleting === trip.id}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {deleting === trip.id ? (
                      <ActivityIndicator color={colour.danger} size="small" />
                    ) : (
                      <Text
                        style={{ ...typography.caption, color: colour.danger }}
                      >
                        Delete
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              );
            })}

            <InfoBanner
              icon="car.fill"
              title="What SARS needs in your logbook"
              body={`For each work trip: the date, the km, where you drove from and to, and why. For each vehicle: the km on your dashboard at the start and end of the tax year. ${isEmployee ? EMPLOYEE_VEHICLE_NOTE : "We compare your work km to all the km you drove, and you claim that share of your vehicle costs."} Driving between home and your usual workplace doesn't count as work travel.`}
              style={{ marginTop: space.sm }}
            />
          </>
        )}
      </ScrollView>
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

      {/* Bulk-assign a vehicle to trips logged before vehicles existed */}
      <Modal
        visible={showAssign}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssign(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
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
            <Text style={{ ...typography.h4, color: colour.text, marginBottom: space.xs }}>
              Assign vehicle
            </Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub, marginBottom: space.md }}>
              All {unassignedCount} trip{unassignedCount === 1 ? "" : "s"} in {activeTaxYear} with no vehicle will be linked to the one you pick. You can still change a single trip later.
            </Text>
            <ScrollView>
              <VehiclePicker
                vehicles={tripVehicles}
                selectedId={assignVehicleId}
                onSelect={setAssignVehicleId}
                onAddVehicle={() => {
                  // Close the sheet first — a native Modal stays on top of
                  // the pushed screen otherwise.
                  setShowAssign(false);
                  router.push("/vehicle-form");
                }}
              />
            </ScrollView>
            <TouchableOpacity
              onPress={confirmAssign}
              disabled={!assignVehicleId || assigning}
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                paddingVertical: space.md,
                alignItems: "center",
                marginTop: space.lg,
                opacity: !assignVehicleId ? 0.45 : 1,
              }}
              activeOpacity={0.85}
            >
              {assigning ? (
                <ActivityIndicator color={colour.onPrimary} />
              ) : (
                <Text style={{ ...typography.actionL, color: colour.onPrimary }}>Assign trips</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAssign(false)}
              style={{ alignItems: "center", paddingVertical: space.md }}
            >
              <Text style={{ ...typography.actionS, color: colour.textSub }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ConfirmModal
        visible={!!confirmDeleteId}
        title="Delete trip"
        message="Remove this trip from your logbook? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <MXTabBar />
    </SafeAreaView>
  );
}
