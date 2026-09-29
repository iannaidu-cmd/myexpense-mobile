import { InfoBanner } from "@/components/InfoBanner";
import { isoToDisplayDate } from "@/lib/dateInput";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
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

const fmtKm = (n: number) => `${n.toLocaleString("en-ZA", { maximumFractionDigits: 1 })} km`;

function odometerStatus(r: OdometerReading | undefined): { text: string; needsAction: boolean } {
  const total = odometerTotalKm(r);
  if (total != null) return { text: `${fmtKm(total)} this tax year`, needsAction: false };
  if (r?.openingKm != null) {
    return { text: `Started the year on ${fmtKm(r.openingKm)} · add the end-of-year reading later`, needsAction: false };
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

  const renderVehicle = (v: Vehicle) => {
    const status = odometerStatus(readings[v.id]);
    return (
      <TouchableOpacity
        key={v.id}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: "/vehicle-form", params: { id: v.id } })}
        style={{
          backgroundColor: colour.white,
          borderRadius: radius.lg,
          padding: space.lg,
          marginBottom: space.md,
          borderWidth: 1,
          borderColor: colour.border,
          opacity: v.isArchived ? 0.6 : 1,
          ...platformShadow,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
            <Text style={{ ...typography.labelM, color: colour.textPrimary }}>{vehicleLabel(v)}</Text>
            <Text
              style={{
                ...typography.caption,
                color: status.needsAction && !v.isArchived ? colour.danger : colour.textSecondary,
              }}
            >
              {v.isArchived ? (v.soldDate ? `Sold ${isoToDisplayDate(v.soldDate)}` : "Archived") : status.text}
            </Text>
            {!v.isArchived && wearAndTear[v.id]?.claim != null && wearAndTear[v.id]!.claim! > 0 && (
              <Text style={{ ...typography.caption, color: colour.accentDeep }}>
                Wear & tear {activeTaxYear}: R {wearAndTear[v.id]!.claim!.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            )}
          </View>
          <View
            style={{
              backgroundColor: colour.primaryLight,
              borderRadius: radius.pill,
              paddingHorizontal: space.sm,
              paddingVertical: 2,
              marginRight: space.xs,
            }}
          >
            <Text style={{ ...typography.micro, color: colour.primary, fontWeight: "700" }}>
              {v.registration}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colour.textHint} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Vehicles"
        subtitle={`Tax Year ${activeTaxYear}`}
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
            <Text style={{ ...typography.actionS, color: colour.accentDeep }}>+ Add</Text>
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
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : vehicles.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <IconSymbol name="car.fill" size={48} color={colour.textHint} style={{ marginBottom: space.md } as any} />
            <Text style={{ ...typography.h4, color: colour.textPrimary }}>No vehicles yet</Text>
            <Text
              style={{
                ...typography.bodyM,
                color: colour.textSecondary,
                textAlign: "center",
                marginTop: space.xs,
                marginBottom: space.xl,
              }}
            >
              Add the vehicle you use for work, so each trip in your logbook is linked to it.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/vehicle-form")}
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                paddingVertical: space.md,
                paddingHorizontal: space.xl,
              }}
            >
              <Text style={{ ...typography.btnL, color: colour.onPrimary }}>Add vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.sm }}>
                IN USE
              </Text>
            )}
            {active.map(renderVehicle)}

            {archived.length > 0 && (
              <Text
                style={{
                  ...typography.labelM,
                  color: colour.textSecondary,
                  marginTop: space.md,
                  marginBottom: space.sm,
                }}
              >
                SOLD & ARCHIVED
              </Text>
            )}
            {archived.map(renderVehicle)}

            <InfoBanner
              icon="car.fill"
              title="Your km readings"
              body="For each vehicle, write down the km on your dashboard on 1 March and on the last day of February. You need both to claim for your vehicle."
              style={{ marginTop: space.sm }}
            />
          </>
        )}
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
