import { AuthHeader } from "@/components/auth/auth-header";
import { AuthInput } from "@/components/auth/auth-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { FormErrors } from "./types";

interface SigninScreenProps {
  onNavigate: (screen: string) => void;
}

export function SigninScreen({ onNavigate }: SigninScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shake, setShake] = useState(false);

  const validate = () => {
    const e: FormErrors = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      triggerShake();
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // TODO: auth with backend
    }, 1400);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  return (
    <ThemedView
      style={[styles.container, shake && { transform: [{ translateX: -8 }] }]}
    >
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to your MyExpense account and pick up where you left off."
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

        <AuthInput
          label="PASSWORD"
          placeholder="Your password"
          icon="🔒"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry={!showPassword}
          showSecureToggle
          onToggleSecure={() => setShowPassword(!showPassword)}
        />

        {/* Forgot password link */}
        <TouchableOpacity
          onPress={() => onNavigate("forgot")}
          style={styles.forgotBtn}
        >
          <ThemedText style={styles.forgotText}>
            Forgot your password?
          </ThemedText>
        </TouchableOpacity>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.primaryBtnText}>
            {loading ? "Signing in…" : "Sign In"}
          </ThemedText>
        </TouchableOpacity>

        {/* Create account link */}
        <View style={styles.footerRow}>
          <ThemedText style={styles.footerText}>
            Don't have an account?{" "}
          </ThemedText>
          <TouchableOpacity onPress={() => onNavigate("signup")}>
            <ThemedText style={styles.link}>Create one</ThemedText>
          </TouchableOpacity>
        </View>
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
  forgotBtn: {
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  forgotText: {
    fontSize: 13,
    color: "#0288D1",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#0288D1",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 13,
    color: "#0D47A1",
  },
  link: {
    color: "#0288D1",
    fontWeight: "600",
  },
});
