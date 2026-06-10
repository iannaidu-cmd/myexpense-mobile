import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
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
  const appState = useRef(AppState.currentState);

  // When user returns to the app after clicking the confirmation link,
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
      await supabase.auth.resend({ type: "signup", email: email ?? "" });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: colour.primary,
            paddingHorizontal: space.lg,
            paddingTop: space["2xl"],
            paddingBottom: space["3xl"],
          }}
        >
          <Text
            style={{
              ...typography.h2,
              fontWeight: "800",
              color: colour.onPrimary,
              marginBottom: space.xs,
            }}
          >
            Check your email
          </Text>
          <Text
            style={{ ...typography.bodyM, color: "rgba(255,255,255,0.75)" }}
          >
            One more step to activate your account.
          </Text>
        </View>

        {/* Card */}
        <View
          style={{
            flex: 1,
            backgroundColor: colour.white,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            marginTop: -20,
            padding: space.lg,
            paddingTop: space["2xl"],
          }}
        >
          {/* Email display */}
          <View
            style={{
              backgroundColor: colour.surface1,
              borderRadius: radius.md,
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              marginBottom: space.xl,
            }}
          >
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.textSub,
                fontWeight: "700",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              SENT TO
            </Text>
            <Text
              style={{
                ...typography.bodyM,
                fontWeight: "600",
                color: colour.primary,
              }}
            >
              {email}
            </Text>
          </View>

          {/* Instruction */}
          <Text
            style={{
              ...typography.bodyM,
              color: colour.text,
              lineHeight: 24,
              marginBottom: space.xl,
            }}
          >
            We've sent a confirmation email to this address. Open it and tap{" "}
            <Text style={{ fontWeight: "700" }}>"Confirm My Email"</Text> to
            activate your account.{"\n\n"}Once confirmed, come back here and
            you'll be signed in automatically.
          </Text>

          {/* Tips */}
          <View
            style={{
              backgroundColor: colour.surface1,
              borderRadius: radius.md,
              padding: space.md,
              marginBottom: space.xl,
            }}
          >
            <Text
              style={{
                ...typography.labelS,
                color: colour.textSub,
                fontWeight: "700",
                marginBottom: space.sm,
              }}
            >
              Can't find the email?
            </Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub, marginBottom: 4 }}>
              • Check your spam or junk folder
            </Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub }}>
              • Sent from noreply@myexpense.co.za
            </Text>
          </View>

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
                backgroundColor: colour.primary50,
                borderRadius: radius.pill,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: space.md,
                opacity: resendLoading ? 0.6 : 1,
              }}
            >
              <Text style={{ ...typography.btnL, color: colour.primary }}>
                {resendLoading ? "Sending…" : "Resend confirmation email"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Back to sign up */}
          <TouchableOpacity
            onPress={() => router.replace("/sign-up")}
            style={{
              borderRadius: radius.pill,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: colour.border,
            }}
          >
            <Text style={{ ...typography.btnL, color: colour.textSub }}>
              Create different account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
