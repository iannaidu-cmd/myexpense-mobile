import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    AppState,
    AppStateStatus,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface VerifyEmailScreenProps {
  email?: string;
}

export function VerifyEmailScreen({
  email = "your@email.com",
}: VerifyEmailScreenProps) {
  const router = useRouter();
  const { initialise } = useAuthStore();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const appState = useRef(AppState.currentState);

  // When user returns to the app after tapping the confirmation link,
  // check if their session is now active and redirect them in.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            await initialise();
            router.replace("/(tabs)");
          }
        }
        appState.current = nextState;
      }
    );
    return () => subscription.remove();
  }, []);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await supabase.auth.resend({
        type: "signup",
        email: email ?? "",
        options: { emailRedirectTo: "myexpense://" },
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.primary }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.xl,
            paddingBottom: space["3xl"],
          }}
        >
          <Text
            style={{
              ...typography.h1,
              fontWeight: "800",
              color: colour.onPrimary,
              marginBottom: space.xs,
            }}
          >
            Check your email
          </Text>
          <Text style={{ ...typography.bodyM, color: "rgba(255,255,255,0.80)" }}>
            One quick step to activate your MyExpense account.
          </Text>
        </View>

        {/* Body */}
        <View
          style={{
            flex: 1,
            backgroundColor: colour.background,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            marginTop: -20,
            padding: space.lg,
            paddingTop: space["2xl"],
          }}
        >
          {/* Envelope icon with checkmark badge */}
          <View style={{ alignItems: "center", marginBottom: space.xl }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colour.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="envelope.fill" size={36} color={colour.onPrimary} />
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: "33%",
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: colour.success,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2.5,
                borderColor: colour.background,
              }}
            >
              <IconSymbol name="checkmark" size={12} color={colour.onPrimary} />
            </View>
          </View>

          {/* Sent to */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.lg,
              paddingVertical: space.md,
              paddingHorizontal: space.md,
              marginBottom: space.xl,
              flexDirection: "row",
              alignItems: "center",
              gap: space.md,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: colour.primary50,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconSymbol name="envelope.fill" size={18} color={colour.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.textSub,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                SENT TO
              </Text>
              <Text
                style={{
                  ...typography.bodyM,
                  fontWeight: "600",
                  color: colour.text,
                }}
                numberOfLines={1}
              >
                {email}
              </Text>
            </View>
          </View>

          {/* Steps */}
          <View style={{ marginBottom: space.xl }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: space.md,
                marginBottom: space.lg,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colour.primary50,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Text style={{ ...typography.labelS, fontWeight: "700", color: colour.primary }}>
                  1
                </Text>
              </View>
              <Text style={{ ...typography.bodyM, color: colour.text, flex: 1, lineHeight: 22, marginTop: 3 }}>
                Open the email and tap{" "}
                <Text style={{ fontWeight: "700" }}>"Confirm my email"</Text>.
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: space.md,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colour.primary50,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Text style={{ ...typography.labelS, fontWeight: "700", color: colour.primary }}>
                  2
                </Text>
              </View>
              <Text style={{ ...typography.bodyM, color: colour.text, flex: 1, lineHeight: 22, marginTop: 3 }}>
                Come back here. We'll sign you in the moment it's confirmed.
              </Text>
            </View>
          </View>

          {/* Waiting status */}
          <View
            style={{
              backgroundColor: colour.successBg,
              borderRadius: radius.md,
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
              marginBottom: space.xl,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: colour.success,
                flexShrink: 0,
              }}
            />
            <Text
              style={{
                ...typography.bodyS,
                color: colour.success,
                fontWeight: "600",
                flex: 1,
              }}
            >
              Waiting for you to confirm, this updates automatically
            </Text>
          </View>

          {/* Can't find the email — collapsible */}
          <TouchableOpacity
            onPress={() => setHelpExpanded(!helpExpanded)}
            activeOpacity={0.8}
            style={{
              backgroundColor: colour.white,
              borderTopLeftRadius: radius.md,
              borderTopRightRadius: radius.md,
              borderBottomLeftRadius: helpExpanded ? 0 : radius.md,
              borderBottomRightRadius: helpExpanded ? 0 : radius.md,
              paddingVertical: space.md,
              paddingHorizontal: space.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: helpExpanded ? 0 : space.xl,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 1.5,
                  borderColor: colour.textSub,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: colour.textSub }}>?</Text>
              </View>
              <Text style={{ ...typography.bodyM, fontWeight: "600", color: colour.text }}>
                Can't find the email?
              </Text>
            </View>
            <IconSymbol
              name={helpExpanded ? "chevron.up" : "chevron.down"}
              size={16}
              color={colour.textSub}
            />
          </TouchableOpacity>

          {helpExpanded && (
            <View
              style={{
                backgroundColor: colour.white,
                borderBottomLeftRadius: radius.md,
                borderBottomRightRadius: radius.md,
                paddingHorizontal: space.md,
                paddingBottom: space.md,
                marginBottom: space.xl,
              }}
            >
              <View style={{ height: 1, backgroundColor: colour.borderLight, marginBottom: space.sm }} />
              <Text style={{ ...typography.bodyS, color: colour.textSub, marginBottom: 4 }}>
                • Check your spam or junk folder
              </Text>
              <Text style={{ ...typography.bodyS, color: colour.textSub }}>
                • Sent from noreply@myexpense.co.za
              </Text>
            </View>
          )}

          {/* Resend */}
          {resendSent ? (
            <View
              style={{
                backgroundColor: colour.primary50,
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space.md,
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.bodyS, color: colour.primary, fontWeight: "600" }}>
                Confirmation email resent — check your inbox.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendLoading}
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                height: 56,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: space.md,
                opacity: resendLoading ? 0.6 : 1,
              }}
            >
              <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
                {resendLoading ? "Sending…" : "Resend confirmation email"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Use different email */}
          <TouchableOpacity
            onPress={() => router.replace("/sign-up")}
            style={{
              borderRadius: radius.pill,
              height: 56,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: colour.border,
            }}
          >
            <Text style={{ ...typography.btnL, color: colour.text }}>
              Use a different email
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
