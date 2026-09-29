import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { NoteCard, SectionEyebrow } from "@/components/MXSection";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { isoToDisplayDate } from "@/lib/dateInput";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import {
  odometerTotalKm,
  useVehicleStore,
  vehicleLabel,
  type OdometerReading,
  type Vehicle,
} from "@/stores/vehicleStore";
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

const fmtKm = (n: number) => `${n.toLocaleString("en-ZA", { maximumFractionDigits: 1 })} km`;
const fmtR = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function kmStatus(r: OdometerReading | undefined): { text: string; needsAction: boolean } {
  const total = odometerTotalKm(r);
  if (total != null) return { text: `${fmtKm(total)} this tax year`, needsAction: false };
  if (r?.openingKm != null) {
    return { text: `Started the year on ${fmtKm(r.openingKm)}`, needsAction: false };
  }
  return { text: "Start-of-year km reading missing", needsAction: true };
}

export default function VehiclesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();
  const { vehicles, readings, wearAndTear, load, syncWearAndTear } = useVehicleStore();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) { setLoading(false); return; }
      load(user.id, activeTaxYear, true)
        .catch((e) => console.error("Vehicles load error:", e))
        .finally(() => setLoading(false));
      syncWearAndTear(user.id, activeTaxYear);
    }, [user, activeTaxYear]),
  );

  const active = vehicles.filter((v) => !v.isArchived);
  const archived = vehicles.filter((v) => v.isArchived);

  // One row, same build as the expense-history list rows.
  const renderVehicle = (v: Vehicle, i: number, list: Vehicle[]) => {
    const status = kmStatus(readings[v.id]);
    const claim = wearAndTear[v.id]?.claim;
    return (
      <TouchableOpacity
        key={v.id}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: "/vehicle-form", params: { id: v.id } })}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: space.md,
          borderBottomWidth: i < list.length - 1 ? 1 : 0,
          borderBottomColor: colour.border,
          opacity: v.isArchived ? 0.6 : 1,
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
          <Text style={{ ...typography.itemTitle, color: colour.textPrimary }} numberOfLines={1}>
            {vehicleLabel(v)}
          </Text>
          <Text
            style={{
              ...typography.itemSub,
              color: status.needsAction && !v.isArchived ? colour.danger : colour.textSecondary,
              marginTop: 2,
            }}
          >
            {v.isArchived
              ? v.soldDate
                ? `Sold ${isoToDisplayDate(v.soldDate)}`
                : "Hidden"
              : `${v.registration} · ${status.text}`}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 5 }}>
          {!v.isArchived && claim != null && claim > 0 ? (
            <>
              <Text style={{ ...typography.itemAmount, color: colour.accentDeep }}>{fmtR(claim)}</Text>
              <Text style={{ ...typography.itemSub, color: colour.textSecondary }}>wear & tear</Text>
            </>
          ) : (
            <IconSymbol name="chevron.right" size={14} color={colour.textHint} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const listCard = (list: Vehicle[]) => (
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
      {list.map((v, i) => renderVehicle(v, i, list))}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Vehicles"
        subtitle={`Tax year ${activeTaxYear}`}
        showBack
        right={
          <TouchableOpacity
            onPress={() => router.push("/vehicle-form")}
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
            }}
          >
            <Text style={{ ...typography.chipText, color: colour.accentDeep }}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} />
          </View>
        ) : vehicles.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"], paddingHorizontal: space.lg }}>
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
            <Text style={{ ...typography.cardTitle, color: colour.textPrimary }}>No vehicles yet</Text>
            <Text
              style={{
                ...typography.mSub,
                color: colour.textSecondary,
                textAlign: "center",
                marginTop: space.xs,
                marginBottom: space.xl,
              }}
            >
              Add the vehicle you use for work, so each trip in your logbook is linked to it.
            </Text>
            <MXButton label="Add vehicle" variant="primary" size="L" onPress={() => router.push("/vehicle-form")} fullWidth />
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <SectionEyebrow>In use</SectionEyebrow>
                {listCard(active)}
              </>
            )}
            {archived.length > 0 && (
              <>
                <SectionEyebrow>Sold or hidden</SectionEyebrow>
                {listCard(archived)}
              </>
            )}

            <NoteCard
              icon="car.fill"
              title="Your km readings"
              body="For each vehicle, write down the km on your dashboard on 1 March and on the last day of February. You need both to claim for your vehicle."
            />
          </>
        )}
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
