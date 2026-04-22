import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SARS_RATE_PER_KM = 4.84;

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

interface MileageTrip {
  id: string;
  purpose: string;
  distance_km: number;
  duration_seconds: number;
  trip_date: string;
  is_deductible: boolean;
  notes: string | null;
  tax_year: string;
  created_at: string;
}

export default function MileageHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("mileage_trips")
        .select("*")
        .eq("user_id", user.id)
        .eq("tax_year", ACTIVE_TAX_YEAR)
        .order("trip_date", { ascending: false });

      if (error) {
        // PGRST205 = table not in schema cache yet — treat as empty rather than crashing
        if (error.code === "PGRST205") {
          setTrips([]);
        } else {
          throw error;
        }
      } else {
        setTrips(data ?? []);
      }
    } catch (e: any) {
      console.error("MileageHistory load error:", e);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips]),
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete trip",
      "Remove this trip from your logbook? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(id);
            try {
              const { supabase } = await import("@/lib/supabase");
              await supabase.from("mileage_trips").delete().eq("id", id);
              await loadTrips();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            } finally {
              setDeleting(null);
            }
          },
        },
      ],
    );
  };

  // Totals
  const totalKm = trips.reduce((s, t) => s + Number(t.distance_km), 0);
  const totalDeductions = totalKm * SARS_RATE_PER_KM;
  const totalTrips = trips.length;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Trip Logbook"
        subtitle={`Tax Year ${ACTIVE_TAX_YEAR}`}
        showBack
        right={
          <TouchableOpacity
            onPress={() => router.push("/mileage-tracker")}
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: radius.pill,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
            }}
          >
            <Text style={{ ...typography.actionS, color: colour.onPrimary }}>
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
        {/* Summary cards */}
        <View
          style={{
            flexDirection: "row",
            gap: space.sm,
            marginBottom: space.lg,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colour.primary,
              borderRadius: radius.md,
              padding: space.md,
            }}
          >
            <Text
              style={{ ...typography.caption, color: "rgba(255,255,255,0.7)" }}
            >
              Total Distance
            </Text>
            <Text
              style={{
                ...typography.amountS,
                color: colour.onPrimary,
                marginTop: 2,
              }}
            >
              {totalKm.toFixed(1)} km
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colour.white,
              borderRadius: radius.md,
              padding: space.md,
              borderWidth: 1,
              borderColor: colour.border,
            }}
          >
            <Text
              style={{ ...typography.caption, color: colour.textSecondary }}
            >
              Est. Deduction
            </Text>
            <Text
              style={{
                ...typography.amountS,
                color: colour.success,
                marginTop: 2,
              }}
            >
              R{totalDeductions.toFixed(0)}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colour.white,
              borderRadius: radius.md,
              padding: space.md,
              borderWidth: 1,
              borderColor: colour.border,
            }}
          >
            <Text
              style={{ ...typography.caption, color: colour.textSecondary }}
            >
              Trips
            </Text>
            <Text
              style={{
                ...typography.amountS,
                color: colour.textPrimary,
                marginTop: 2,
              }}
            >
              {totalTrips}
            </Text>
          </View>
        </View>

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
            {trips.map((trip) => (
              <View
                key={trip.id}
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
                      {formatElapsed(trip.duration_seconds)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{ ...typography.labelM, color: colour.primary }}
                    >
                      {Number(trip.distance_km).toFixed(2)} km
                    </Text>
                    <Text
                      style={{ ...typography.caption, color: colour.success }}
                    >
                      R
                      {(Number(trip.distance_km) * SARS_RATE_PER_KM).toFixed(2)}
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
                      {formatElapsed(trip.duration_seconds)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        ...typography.micro,
                        color: colour.textSecondary,
                      }}
                    >
                      Deduction
                    </Text>
                    <Text
                      style={{ ...typography.labelS, color: colour.success }}
                    >
                      R
                      {(Number(trip.distance_km) * SARS_RATE_PER_KM).toFixed(2)}
                    </Text>
                  </View>
                </View>

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
              </View>
            ))}

            {/* SARS note */}
            <View
              style={{
                backgroundColor: colour.infoLight,
                borderRadius: radius.md,
                padding: space.md,
                marginTop: space.sm,
              }}
            >
              <Text
                style={{
                  ...typography.labelS,
                  color: colour.info,
                  marginBottom: space.xs,
                }}
              >
                SARS Logbook Requirement
              </Text>
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.info,
                  lineHeight: 18,
                }}
              >
                SARS requires a travel logbook for vehicle expense claims. This
                logbook records each business trip with date, distance, purpose
                and calculated deduction at the deemed rate of R4.84/km for the
                2024/25 tax year.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
