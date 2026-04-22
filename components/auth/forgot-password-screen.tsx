import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuthStore();

  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [sent, setSent]       = useState(false);

  const handleSubmit = async () => {
    if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e: any) {
      setEmailError(e.message ?? "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.lg, paddingTop: space["2xl"] }}>

          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: space.xl }}>
            <Text style={{ ...typography.bodyM, color: colour.primary, fontWeight: "600" }}>← Back to Sign In</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colour.primary50, alignItems: "center", justifyContent: "center", marginBottom: space.xl }}>
            <Text style={{ fontSize: 32 }}>✉️</Text>
          </View>

          <Text style={{ ...typography.h2, fontWeight: "800", color: colour.text, marginBottom: space.sm }}>
            Check your email
          </Text>
          <Text style={{ ...typography.bodyM, color: colour.textSub, marginBottom: space.xl, lineHeight: 24 }}>
            We've sent password reset instructions to:
          </Text>
          <Text style={{ ...typography.bodyM, fontWeight: "700", color: colour.primary, marginBottom: space.xl }}>
            {email}
          </Text>

          {/* Tips */}
          <View style={{ backgroundColor: colour.primary50, borderRadius: radius.md, padding: space.md, marginBottom: space.xl }}>
            <Text style={{ ...typography.labelS, color: colour.primary, fontWeight: "700", marginBottom: space.sm }}>
              Can't find the email?
            </Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub, marginBottom: 4 }}>• Check your spam or junk folder</Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub, marginBottom: 4 }}>• The link expires in 1 hour</Text>
            <Text style={{ ...typography.bodyS, color: colour.textSub }}>• Sent from noreply@myexpense.co.za</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/sign-in")}
            style={{ backgroundColor: colour.primary, borderRadius: radius.pill, height: 52, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ ...typography.btnL, color: colour.onPrimary }}>Back to Sign In</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={{ backgroundColor: colour.primary, paddingHorizontal: space.lg, paddingTop: space["2xl"], paddingBottom: space["3xl"] }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: space.lg }}>
              <Text style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ ...typography.h2, fontWeight: "800", color: colour.onPrimary, marginBottom: space.xs }}>
              Reset password
            </Text>
            <Text style={{ ...typography.bodyM, color: "rgba(255,255,255,0.75)" }}>
              Enter your email and we'll send you a reset link.
            </Text>
          </View>

          {/* Card */}
          <View style={{ flex: 1, backgroundColor: colour.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -20, padding: space.lg, paddingTop: space["2xl"] }}>

            <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.xs }}>EMAIL ADDRESS</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="you@example.co.za" placeholderTextColor={colour.textHint}
              keyboardType="email-address" autoCapitalize="none"
              style={{ ...typography.bodyM, color: colour.text, borderBottomWidth: 1.5, borderBottomColor: emailError ? colour.danger : colour.border, paddingVertical: space.sm, marginBottom: emailError ? space.xs : space["2xl"] }}
            />
            {emailError ? <Text style={{ ...typography.bodyXS, color: colour.danger, marginBottom: space.xl }}>{emailError}</Text> : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{ backgroundColor: loading ? colour.border : colour.primary, borderRadius: radius.pill, height: 52, alignItems: "center", justifyContent: "center", marginBottom: space.md }}
            >
              {loading
                ? <ActivityIndicator color={colour.onPrimary} />
                : <Text style={{ ...typography.btnL, color: colour.onPrimary }}>Send Reset Link</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={{ borderRadius: radius.pill, height: 52, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colour.border }}
            >
              <Text style={{ ...typography.btnL, color: colour.textSub }}>Back to Sign In</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
