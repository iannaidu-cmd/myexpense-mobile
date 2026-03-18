import { AuthHeader } from "@/components/auth/auth-header";
import { AuthInput } from "@/components/auth/auth-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { FormErrors } from "./types";

interface ForgotPasswordScreenProps {
  onNavigate: (screen: string) => void;
}

export function ForgotPasswordScreen({
  onNavigate,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e: FormErrors = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1400);
  };

  if (sent) {
    return (
      <ThemedView style={styles.container}>
        <AuthHeader
          title="Check your email"
          subtitle="We've sent password reset instructions to your email address."
        />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration */}
          <View style={styles.illustrationBox}>
            <ThemedText style={styles.illustrationEmoji}>✉️</ThemedText>
          </View>

          <ThemedText style={styles.sentEmail}>{email}</ThemedText>

          <ThemedText style={styles.instructions}>
            Click the link in the email to reset your password. The link expires
            in 1 hour.
          </ThemedText>

          {/* Tips box */}
          <View style={styles.tipsBox}>
            <ThemedText style={styles.tipsTitle}>
              💡 Can't find the email?
            </ThemedText>
            <ThemedText style={styles.tip}>• Check your spam folder</ThemedText>
            <ThemedText style={styles.tip}>• Link expires in 1 hour</ThemedText>
            <ThemedText style={styles.tip}>
              • Sent from noreply@myexpense.co.za
            </ThemedText>
          </View>

          {/* Back button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => onNavigate("signin")}
          >
            <ThemedText style={styles.primaryBtnText}>
              Back to Sign In
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AuthHeader
        title="Reset password"
        subtitle="Enter your email address and we'll send you a link to reset your password."
      />

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AuthInput
          label="EMAIL ADDRESS"
          placeholder="you@example.co.za"
          icon="📧"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.primaryBtnText}>
            {loading ? "Sending…" : "Send Reset Link"}
          </ThemedText>
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => onNavigate("signin")}
        >
          <ThemedText style={styles.secondaryBtnText}>
            Back to Sign In
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  illustrationBox: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  illustrationEmoji: {
    fontSize: 64,
  },
  sentEmail: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D47A1",
    textAlign: "center",
    marginBottom: 12,
  },
  instructions: {
    fontSize: 13,
    color: "#0D47A1",
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 24,
  },
  tipsBox: {
    backgroundColor: "rgba(2,136,209,0.08)",
    borderWidth: 1,
    borderColor: "rgba(2,136,209,0.2)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D47A1",
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
    lineHeight: 1.5,
  },
  primaryBtn: {
    backgroundColor: "#0288D1",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0288D1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: "#E0E0E0",
    shadowOpacity: 0,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
