import { useAuthStore } from "@/stores/authStore";
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

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: colour.warningLight, text: colour.warning },
  processing: { label: "Processing", bg: colour.infoLight, text: colour.info },
  done: { label: "Processed", bg: colour.successLight, text: colour.success },
  failed: { label: "Failed", bg: colour.dangerLight, text: colour.danger },
} as const;

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
};

export default function ScanTabScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"scan" | "history">("scan");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReceipts = useCallback(async () => {
    if (!user || tab !== "history") return;
    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase
        .from("receipts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setReceipts(data ?? []);
    } catch (e) {
      console.error("Receipts load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, tab]);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts]),
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: space.lg,
          paddingTop: space.lg,
          paddingBottom: space["4xl"],
        }}
      >
        <Text style={{ ...typography.h3, color: colour.onPrimary }}>
          Scan and upload
        </Text>
        <Text
          style={{
            ...typography.bodyS,
            color: "rgba(255,255,255,0.7)",
            marginTop: 2,
          }}
        >
          OCR-powered receipt capture
        </Text>
      </View>

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.bgPage,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab toggle */}
        <View style={{ flexDirection: "row", margin: space.lg, gap: space.sm }}>
          {(["scan", "history"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setTab(t);
                if (t === "history") loadReceipts();
              }}
              style={{
                flex: 1,
                height: 40,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: tab === t ? colour.primary : "transparent",
                borderWidth: 1.5,
                borderColor: tab === t ? colour.primary : colour.border,
              }}
            >
              <Text
                style={{
                  ...typography.btnM,
                  color:
                    tab === t ? colour.textOnPrimary : colour.textSecondary,
                }}
              >
                {t === "scan" ? "Capture" : "History"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "scan" ? (
          <View style={{ paddingHorizontal: space.lg }}>
            {/* Upload from gallery */}
            <TouchableOpacity
              onPress={() => router.push("/upload-from-gallery")}
              style={{
                backgroundColor: colour.bgCard,
                borderRadius: radius.lg,
                padding: space.xl,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: space.md,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: radius.md,
                  backgroundColor: colour.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: space.lg,
                }}
              >
                <Text style={{ fontSize: 26 }}>🖼️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.h4, color: colour.textPrimary }}>
                  Upload from gallery
                </Text>
                <Text
                  style={{ ...typography.bodyS, color: colour.textSecondary }}
                >
                  Select photos or PDFs from your device
                </Text>
              </View>
              <Text style={{ color: colour.textSecondary, fontSize: 18 }}>
                {String.fromCharCode(8250)}
              </Text>
            </TouchableOpacity>

            {/* Enter manually */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/add-expense")}
              style={{
                backgroundColor: colour.bgCard,
                borderRadius: radius.lg,
                padding: space.xl,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: space.lg,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: radius.md,
                  backgroundColor: colour.tealLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: space.lg,
                }}
              >
                <Text style={{ fontSize: 26 }}>✏️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.h4, color: colour.textPrimary }}>
                  Enter manually
                </Text>
                <Text
                  style={{ ...typography.bodyS, color: colour.textSecondary }}
                >
                  Type in expense details directly
                </Text>
              </View>
              <Text style={{ color: colour.textSecondary, fontSize: 18 }}>
                {String.fromCharCode(8250)}
              </Text>
            </TouchableOpacity>

            {/* Scan receipt — large CTA at bottom */}
            <TouchableOpacity
              onPress={() => router.push("/scan-receipt-camera")}
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.lg,
                padding: space["3xl"],
                alignItems: "center",
                marginBottom: space.lg,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: space.lg,
                }}
              >
                <Text style={{ fontSize: 40 }}>📸</Text>
              </View>
              <Text
                style={{
                  ...typography.h4,
                  color: colour.textOnPrimary,
                  marginBottom: space.xs,
                }}
              >
                Scan receipt
              </Text>
              <Text
                style={{
                  ...typography.bodyM,
                  color: "rgba(255,255,255,0.8)",
                  textAlign: "center",
                }}
              >
                Point your camera at a receipt to auto-capture amount, date and
                vendor
              </Text>
            </TouchableOpacity>

            {/* Tips */}
            <View
              style={{
                backgroundColor: colour.infoLight,
                borderRadius: radius.md,
                padding: space.lg,
              }}
            >
              <Text
                style={{
                  ...typography.labelM,
                  color: colour.info,
                  marginBottom: space.sm,
                }}
              >
                Tips for best scan results
              </Text>
              {[
                "Ensure good lighting — avoid shadows on the receipt",
                "Keep the receipt flat and uncrumpled",
                "Capture the full receipt including the total amount",
                "JPEG and PDF formats are supported",
              ].map((tip, i) => (
                <View
                  key={i}
                  style={{ flexDirection: "row", marginBottom: space.xs }}
                >
                  <Text style={{ ...typography.bodyS, color: colour.info }}>
                    {"\u2022"} {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: space.lg }}>
            <Text
              style={{
                ...typography.labelM,
                color: colour.textSecondary,
                marginBottom: space.sm,
              }}
            >
              Recent receipts
            </Text>
            {loading ? (
              <View style={{ alignItems: "center", paddingTop: space["3xl"] }}>
                <ActivityIndicator color={colour.primary} />
              </View>
            ) : receipts.length === 0 ? (
              <View
                style={{ alignItems: "center", paddingVertical: space["4xl"] }}
              >
                <Text style={{ fontSize: 40, marginBottom: space.md }}>🧾</Text>
                <Text style={{ ...typography.h4, color: colour.textPrimary }}>
                  No receipts yet
                </Text>
                <Text
                  style={{
                    ...typography.bodyM,
                    color: colour.textSecondary,
                    textAlign: "center",
                    marginTop: space.xs,
                  }}
                >
                  Scan your first receipt to get started
                </Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: colour.bgCard,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colour.border,
                }}
              >
                {receipts.map((receipt, i) => {
                  const status =
                    receipt.ocr_status as keyof typeof STATUS_CONFIG;
                  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  return (
                    <TouchableOpacity
                      key={receipt.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: space.lg,
                        borderBottomWidth: i < receipts.length - 1 ? 1 : 0,
                        borderBottomColor: colour.border,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: radius.sm,
                          backgroundColor: colour.primaryLight,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: space.md,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>🧾</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            ...typography.labelM,
                            color: colour.textPrimary,
                          }}
                          numberOfLines={1}
                        >
                          {receipt.file_name ?? "Receipt"}
                        </Text>
                        <Text
                          style={{
                            ...typography.caption,
                            color: colour.textSecondary,
                          }}
                        >
                          {formatDate(receipt.created_at)}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: cfg.bg,
                          borderRadius: radius.full,
                          paddingHorizontal: space.xs,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            ...typography.micro,
                            color: cfg.text,
                            fontWeight: "600",
                          }}
                        >
                          {cfg.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
