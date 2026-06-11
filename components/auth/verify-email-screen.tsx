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
  const { initialise, clearPendingEmailVerification } = useAuthStore();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          const { data } = await supabase.auth.getSession();
          const emailConfirmed =
            data.session?.user &&
            (!data.session.user.email || !!data.session.user.email_confirmed_at);
          if (emailConfirmed) {
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
        options: { emailRedirectTo: "myexpense://auth/callback" },
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top flex spacer */}
        <View style={{ flex: 1, minHeight: 48 }} />

        {/* Icon */}
        <View style={{ alignItems: "center", marginBottom: space.xxl }}>
          <View style={{ position: "relative" }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 24,
                backgroundColor: colour.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="envelope.fill" size={40} color={colour.onPrimary} />
            </View>
            <View
              style={{
                position: "absolute",
                bottom: -6,
                right: -6,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colour.primary300,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: colour.background,
              }}
            >
              <IconSymbol name="checkmark" size={13} color={colour.onPrimary} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text
          style={{
            ...typography.h1,
            fontWeight: "800",
            color: colour.text,
            textAlign: "center",
            marginBottom: space.sm,
          }}
        >
          Check your email
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            ...typography.bodyM,
            color: colour.textSub,
            textAlign: "center",
            marginBottom: space.lg,
          }}
        >
          We sent a confirmation link to
        </Text>

        {/* Email pill */}
        <View
          style={{
            backgroundColor: colour.white,
            borderRadius: radius.pill,
            paddingVertical: space.md,
            paddingHorizontal: space.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            alignSelf: "center",
            marginBottom: space.xl,
          }}
        >
          <IconSymbol name="envelope.fill" size={15} color={colour.primary} />
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

        {/* Instruction */}
        <Text
          style={{
            ...typography.bodyM,
            color: colour.text,
            textAlign: "center",
            marginBottom: space.xl,
          }}
        >
          Open it and tap{" "}
          <Text style={{ fontWeight: "700" }}>"Confirm my email"</Text>. We'll{"\n"}
          sign you in here automatically.
        </Text>

        {/* Waiting indicator */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: space.sm,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colour.primary200,
            }}
          />
          <Text
            style={{
              ...typography.bodyS,
              color: colour.textSub,
              fontWeight: "600",
            }}
          >
            Waiting for you to confirm
          </Text>
        </View>

        {/* Bottom flex spacer */}
        <View style={{ flex: 2, minHeight: 48 }} />

        {/* Resend button */}
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

        {/* Use a different email */}
        <TouchableOpacity
          onPress={() => { clearPendingEmailVerification(); router.replace("/sign-up"); }}
          style={{
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.md,
          }}
        >
          <Text style={{ ...typography.btnL, color: colour.primary }}>
            Use a different email
          </Text>
        </TouchableOpacity>

        {/* Footer hint */}
        <Text
          style={{
            ...typography.bodyXS,
            color: colour.textSub,
            textAlign: "center",
            marginBottom: space.xxl,
          }}
        >
          Can't find it? Check your spam folder, or look for noreply@myexpense.co.za.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
