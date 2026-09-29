import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { claimsVehicleCostsAsBusiness, EMPLOYEE_VEHICLE_NOTE } from "@/lib/workType";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space, typography } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

export default function MileageTripSummaryScreen() {
  const router = useRouter();
  const { activeTaxYear } = useExpenseStore();
  const { user } = useAuthStore();
  // Salaried employees can't claim vehicle costs themselves (lib/workType.ts).
  const [isEmployee, setIsEmployee] = useState(false);
  useEffect(() => {
    if (!user) return;
    profileService
      .getProfile(user.id)
      .then((p) => setIsEmployee(!claimsVehicleCostsAsBusiness(p?.work_type)))
      .catch(() => {});
  }, [user]);
  const params = useLocalSearchParams<{
    tripId: string;
    distanceKm: string;
    elapsed: string;
    purpose: string;
    itr12: string;
    note: string;
    startTime: string;
    startLat: string;
    startLon: string;
    endLat: string;
    endLon: string;
  }>();

  const distanceKm = parseFloat(params.distanceKm ?? "0");
  const elapsed = parseInt(params.elapsed ?? "0", 10);
  const purpose = params.purpose ?? "Business Travel";
  const itr12 = params.itr12 ?? "S11(a)";
  const note = params.note ?? "";
  const startTime = params.startTime ? new Date(params.startTime) : new Date();

  const startLat = parseFloat(params.startLat ?? "0");
  const startLon = parseFloat(params.startLon ?? "0");
  const endLat = parseFloat(params.endLat ?? "0");
  const endLon = parseFloat(params.endLon ?? "0");

  // Static map — only renders if we have real coords
  const hasCoords = startLat !== 0 && endLat !== 0;
  const midLat = (startLat + endLat) / 2;
  const midLon = (startLon + endLon) / 2;
  const staticMapUrl = hasCoords
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${midLat},${midLon}&zoom=13&size=600x200&maptype=roadmap&markers=color:green%7C${startLat},${startLon}&markers=color:red%7C${endLat},${endLon}&path=color:0x006FFDff|weight:4|${startLat},${startLon}|${endLat},${endLon}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}`
    : null;

  // Self-employed (s11(a)) vehicle claims are actual costs × logbook
  // business-use % — the km themselves are not a deduction, so there's no
  // per-km expense to add here. Instead, point to logging an actual cost.
  const handleLogVehicleCost = () => {
    router.push({ pathname: "/add-expense-manual", params: { category: "Vehicle Expenses" } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      {/* Primary-blue header area */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colour.background }}>
        <MXHeader
          title="Trip summary"
          subtitle="Trip complete"
          showBack
          onBack={() => router.replace("/mileage-history")}
        />
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space["3xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero deduction card */}
        <View
          style={{
            marginTop: -space.lg,
            marginHorizontal: space.md,
            backgroundColor: colour.white,
            borderRadius: radius.lg,
            padding: space.lg,
            alignItems: "center",
            ...platformShadow,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colour.brandTeal + "38",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space.sm,
            }}
          >
            <IconSymbol name="checkmark" size={28} color={colour.text} />
          </View>
          <Text style={{ ...typography.h4, color: colour.text }}>
            Trip saved!
          </Text>
          <Text
            style={{
              ...typography.bodyXS,
              color: colour.textSub,
              marginBottom: space.md,
            }}
          >
            {purpose} ·{" "}
            {startTime.toLocaleDateString("en-ZA", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </Text>

          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.md,
              paddingHorizontal: space.xl,
              paddingVertical: space.md,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text style={{ ...typography.captionM, color: colour.primary }}>
              Work km logged
            </Text>
            <Text
              style={{
                ...typography.amountXL,
                color: colour.primary,
                marginTop: 2,
              }}
            >
              {distanceKm.toFixed(2)} km
            </Text>
            <Text style={{ ...typography.bodyXS, color: colour.textSub, textAlign: "center" }}>
              Counts towards how much of your driving is for work
            </Text>
          </View>

          {/* Trip saved to Supabase confirmation */}
          <View
            style={{
              marginTop: space.md,
              backgroundColor: colour.brandTeal + "2E",
              borderRadius: radius.md,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
            }}
          >
            <IconSymbol name="checkmark.circle.fill" size={12} color={colour.text} />
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.text,
                fontWeight: "600",
              }}
            >
              Saved to your mileage logbook
              {params.tripId ? ` · ID: ${params.tripId.slice(0, 8)}…` : ""}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View
          style={{
            marginHorizontal: space.md,
            marginTop: space.md,
            flexDirection: "row",
            gap: space.sm,
          }}
        >
          <StatCard
            icon="map.fill"
            label="Distance"
            value={`${distanceKm.toFixed(2)} km`}
          />
          <StatCard icon="clock.fill" label="Duration" value={formatElapsed(elapsed)} />
          <StatCard icon="clock.fill" label="Departed" value={formatTime(startTime)} />
        </View>

        {/* Route map snapshot */}
        {staticMapUrl && (
          <View
            style={{
              marginHorizontal: space.md,
              marginTop: space.md,
              borderRadius: radius.lg,
              overflow: "hidden",
              height: 160,
              backgroundColor: colour.surface1,
              ...platformShadow,
            }}
          >
            <Image
              source={{ uri: staticMapUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
                paddingVertical: 6,
                paddingHorizontal: space.sm,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ ...typography.captionM, color: "#fff" }}>
                Start
              </Text>
              <Text style={{ ...typography.captionM, color: "#fff" }}>
                End
              </Text>
            </View>
          </View>
        )}

        {/* ITR12 compliance detail */}
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
          <Text
            style={{
              ...typography.bodyS,
              color: colour.textSub,
              marginBottom: space.sm,
            }}
          >
            ITR12 compliance detail
          </Text>
          <DetailRow icon="tag.fill" label="Purpose" value={purpose} />
          <DetailRow icon="doc.text.fill" label="SARS reference" value={itr12} />
          <DetailRow icon="calendar" label="Tax year" value={activeTaxYear} />
          {note ? <DetailRow icon="pencil" label="Reason" value={note} /> : null}
        </View>

        {/* Actions */}
        <View
          style={{
            marginHorizontal: space.md,
            marginTop: space.lg,
            gap: space.sm,
          }}
        >
          {/* View in history */}
          <TouchableOpacity
            onPress={() => router.replace("/mileage-history")}
            style={{
              backgroundColor: colour.primary,
              borderRadius: radius.pill,
              paddingVertical: space.md,
              alignItems: "center",
            }}
            activeOpacity={0.85}
          >
            <Text style={{ ...typography.actionL, color: colour.onPrimary }}>
              View mileage history
            </Text>
          </TouchableOpacity>

          {/* Log an actual vehicle cost */}
          {!isEmployee && (
          <TouchableOpacity
            onPress={handleLogVehicleCost}
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.pill,
              paddingVertical: space.md,
              alignItems: "center",
              borderWidth: 2,
              borderColor: colour.primary,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ ...typography.actionL, color: colour.primary }}>
              Log a vehicle cost
            </Text>
          </TouchableOpacity>
          )}

          {/* Start another */}
          <TouchableOpacity
            onPress={() => router.replace("/mileage-tracker")}
            style={{ paddingVertical: space.md, alignItems: "center" }}
            activeOpacity={0.85}
          >
            <Text style={{ ...typography.actionM, color: colour.textSub }}>
              Start another trip
            </Text>
          </TouchableOpacity>
        </View>

        {/* SARS disclaimer */}
        <View
          style={{
            marginHorizontal: space.md,
            marginTop: space.md,
            backgroundColor: colour.primary + "17",
            borderWidth: 1,
            borderColor: colour.primary + "29",
            borderRadius: radius.note,
            padding: space.sm,
          }}
        >
          <Text style={{ ...typography.bodyXS, color: colour.text }}>
            {isEmployee
              ? `${EMPLOYEE_VEHICLE_NOTE} Check with a tax practitioner before you file.`
              : "If you work for yourself, you claim the work share of what your vehicle really costs you: fuel, insurance, repairs, licence, finance charges and wear & tear. The work share is your work km from this logbook compared to all the km you drove. Check with a tax practitioner before you file."}
          </Text>
        </View>
      </ScrollView>
      <MXTabBar />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colour.white,
        borderRadius: radius.md,
        padding: space.sm,
        alignItems: "center",
        ...platformShadow,
      }}
    >
      <IconSymbol name={icon as any} size={18} color={colour.primary} style={{ marginBottom: 2 } as any} />
      <Text
        style={{
          ...typography.bodyM,
          color: colour.text,
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          ...typography.captionM,
          color: colour.textHint,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: space.xs,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
      }}
    >
      <IconSymbol name={icon as any} size={14} color={colour.textSub} style={{ marginRight: space.sm, marginTop: 2 } as any} />
      <Text style={{ ...typography.bodyXS, color: colour.textSub, width: 110 }}>
        {label}
      </Text>
      <Text style={{ ...typography.bodyS, color: colour.text, flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}
