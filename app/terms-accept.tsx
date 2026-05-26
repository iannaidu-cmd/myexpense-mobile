import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsAcceptScreen() {
  const router = useRouter();
  const { acceptTerms } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!agreed) return;
    setSaving(true);
    try {
      await acceptTerms();
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not save your acceptance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <View style={{ flex: 1, paddingHorizontal: space.lg, justifyContent: "space-between", paddingTop: space["2xl"], paddingBottom: space.xl }}>

        {/* Top content */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          {/* Icon */}
          <View style={{ alignItems: "center", marginBottom: space["2xl"] }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: colour.primary50,
              alignItems: "center", justifyContent: "center",
            }}>
              <IconSymbol name="doc.text.fill" size={36} color={colour.primary} />
            </View>
          </View>

          <Text style={{
            fontSize: 28, fontWeight: "800", color: colour.text,
            textAlign: "center", letterSpacing: -0.8, marginBottom: space.sm,
          }}>
            Before you continue
          </Text>
          <Text style={{
            ...typography.bodyM, color: colour.textSub,
            textAlign: "center", lineHeight: 22, marginBottom: space["3xl"],
          }}>
            Please review and accept our Terms of Service and Privacy Policy to use MyExpense.
          </Text>

          {/* Links */}
          <View style={{
            backgroundColor: colour.bgCard, borderRadius: radius.xl,
            borderWidth: 1, borderColor: colour.border,
            overflow: "hidden", marginBottom: space["2xl"],
          }}>
            <TouchableOpacity
              onPress={() => router.push("/terms" as any)}
              style={{
                flexDirection: "row", alignItems: "center",
                padding: space.lg,
                borderBottomWidth: 1, borderBottomColor: colour.border,
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: radius.md,
                backgroundColor: colour.primary50,
                alignItems: "center", justifyContent: "center", marginRight: space.md,
              }}>
                <IconSymbol name="doc.text.fill" size={16} color={colour.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.labelM, color: colour.text }}>Terms of Service</Text>
                <Text style={{ ...typography.caption, color: colour.textSub, marginTop: 2 }}>
                  How you may use MyExpense
                </Text>
              </View>
              <Text style={{ color: colour.textSub, fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/privacy" as any)}
              style={{
                flexDirection: "row", alignItems: "center",
                padding: space.lg,
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: radius.md,
                backgroundColor: colour.primary50,
                alignItems: "center", justifyContent: "center", marginRight: space.md,
              }}>
                <IconSymbol name="lock.shield.fill" size={16} color={colour.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.labelM, color: colour.text }}>Privacy Policy</Text>
                <Text style={{ ...typography.caption, color: colour.textSub, marginTop: 2 }}>
                  How we handle your data (POPIA)
                </Text>
              </View>
              <Text style={{ color: colour.textSub, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Checkbox row */}
          <TouchableOpacity
            onPress={() => setAgreed((v) => !v)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row", alignItems: "flex-start",
              gap: space.md, paddingHorizontal: space.xs,
            }}
          >
            <View style={{
              width: 22, height: 22, borderRadius: 6, marginTop: 1,
              borderWidth: 2,
              borderColor: agreed ? colour.primary : colour.border,
              backgroundColor: agreed ? colour.primary : colour.white,
              alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {agreed && <IconSymbol name="checkmark" size={12} color={colour.white} />}
            </View>
            <Text style={{ ...typography.bodyS, color: colour.text, flex: 1, lineHeight: 20 }}>
              I have read and agree to the{" "}
              <Text
                style={{ color: colour.primary, fontWeight: "600" }}
                onPress={() => router.push("/terms" as any)}
              >
                Terms of Service
              </Text>
              {" "}and{" "}
              <Text
                style={{ color: colour.primary, fontWeight: "600" }}
                onPress={() => router.push("/privacy" as any)}
              >
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!agreed || saving}
          activeOpacity={0.85}
          style={{
            backgroundColor: agreed ? colour.primary : colour.surface2,
            borderRadius: radius.pill,
            height: 54,
            alignItems: "center",
            justifyContent: "center",
            marginTop: space.xl,
          }}
        >
          {saving ? (
            <ActivityIndicator color={colour.white} />
          ) : (
            <Text style={{
              ...typography.btnL,
              color: agreed ? colour.white : colour.textSub,
            }}>
              Agree & continue
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
