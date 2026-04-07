import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/profileService";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
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

  const [code, setCode] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const codeInputs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, idx: number) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 1);
    const chars = code.split("");
    chars[idx] = cleaned;
    const full = chars.join("").slice(0, 6);
    setCode(full);
    if (cleaned && idx < 5) {
      setTimeout(() => codeInputs.current[idx + 1]?.focus(), 0);
    }
  };

  const handleBackspace = (idx: number) => {
    if (idx > 0 && !code[idx]) {
      setTimeout(() => codeInputs.current[idx - 1]?.focus(), 0);
    }
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setCodeError("Verification code must be 6 digits");
      return;
    }
    setCodeError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email ?? "",
        token: code,
        type: "signup",
      });
      if (error) {
        setCodeError(
          error.message ?? "Invalid or expired code. Please try again.",
        );
        return;
      }
      const userId = data.session?.user?.id;
      if (userId) {
        try {
          const profile = await profileService.getProfile(userId);
          router.replace(
            profile?.tax_number ? "/(tabs)" : ("/profile-setup" as any),
          );
        } catch {
          router.replace("/profile-setup" as any);
        }
      } else {
        // Verification succeeded but no session — fall back to sign-in
        router.replace("/sign-in");
      }
    } finally {
      setLoading(false);
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
            Verify your email
          </Text>
          <Text
            style={{ ...typography.bodyM, color: "rgba(255,255,255,0.75)" }}
          >
            We've sent a 6-digit code to your email address.
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

          {/* 6-digit code inputs */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              justifyContent: "center",
              marginBottom: space.md,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  if (ref) codeInputs.current[i] = ref;
                }}
                value={code[i] || ""}
                onChangeText={(t) => handleCodeChange(t, i)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace") handleBackspace(i);
                }}
                onFocus={() => setFocusedIdx(i)}
                onBlur={() => setFocusedIdx(-1)}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="0"
                placeholderTextColor={colour.border}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor:
                    focusedIdx === i
                      ? colour.primary
                      : code[i]
                        ? colour.primary
                        : colour.border,
                  backgroundColor: code[i] ? colour.primary50 : colour.white,
                  fontSize: 20,
                  fontWeight: "700",
                  textAlign: "center",
                  color: colour.text,
                }}
              />
            ))}
          </View>

          {codeError ? (
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.danger,
                textAlign: "center",
                marginBottom: space.md,
              }}
            >
              {codeError}
            </Text>
          ) : null}

          {/* Resend */}
          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.md,
              padding: space.md,
              marginBottom: space.lg,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                ...typography.bodyS,
                color: colour.textSub,
                marginBottom: 4,
              }}
            >
              Didn't receive the code?{" "}
              <Text style={{ color: colour.primary, fontWeight: "600" }}>
                Resend
              </Text>
            </Text>
            <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
              Code expires in 10 minutes
            </Text>
          </View>

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
              Can't find the code?
            </Text>
            <Text
              style={{
                ...typography.bodyS,
                color: colour.textSub,
                marginBottom: 4,
              }}
            >
              • Check your spam or junk folder
            </Text>
            <Text
              style={{
                ...typography.bodyS,
                color: colour.textSub,
                marginBottom: 4,
              }}
            >
              • Code expires in 10 minutes
            </Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub }}>
              • Sent from noreply@myexpense.co.za
            </Text>
          </View>

          {/* Verify button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || code.length !== 6}
            style={{
              backgroundColor:
                loading || code.length !== 6 ? colour.border : colour.primary,
              borderRadius: radius.pill,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space.md,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colour.onPrimary} />
            ) : (
              <Text
                style={{
                  ...typography.btnL,
                  color: code.length !== 6 ? colour.textSub : colour.onPrimary,
                }}
              >
                Verify Email
              </Text>
            )}
          </TouchableOpacity>

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
