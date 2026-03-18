import { AuthHeader } from "@/components/auth/auth-header";
import { AuthInput } from "@/components/auth/auth-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { FormErrors } from "./types";

interface SignupScreenProps {
  onNavigate: (screen: string) => void;
}

export function SignupScreen({ onNavigate }: SignupScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (!agreed) e.agree = "You must accept the terms to continue";
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
      onNavigate("verify");
    }, 1400);
  };

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;
  const strengthColors = ["transparent", "#E05555", "#F59E0B", "#0288D1"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <ThemedView style={styles.container}>
      <AuthHeader
        title="Create account"
        subtitle="Join 3.8 million self-employed South Africans maximising their tax deductions."
      />

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AuthInput
          label="FULL NAME"
          placeholder="e.g. Ian van der Merwe"
          icon="👤"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

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
          placeholder="Min. 8 characters"
          icon="🔒"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry={!showPassword}
          showSecureToggle
          onToggleSecure={() => setShowPassword(!showPassword)}
        />

        {/* Password strength indicator */}
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View
              style={[
                styles.strengthBar,
                {
                  backgroundColor: strengthColors[passwordStrength],
                },
              ]}
            />
            <ThemedText style={styles.strengthLabel}>
              {strengthLabels[passwordStrength]}
            </ThemedText>
          </View>
        )}

        {/* Terms checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
        >
          <View
            style={[styles.checkbox, agreed && { backgroundColor: "#0288D1" }]}
          >
            {agreed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
          </View>
          <ThemedText style={styles.termsText}>
            I agree to the{" "}
            <ThemedText style={styles.link}>Terms of Service</ThemedText> and{" "}
            <ThemedText style={styles.link}>Privacy Policy</ThemedText>
          </ThemedText>
        </TouchableOpacity>
        {errors.agree && (
          <ThemedText style={styles.error}>{errors.agree}</ThemedText>
        )}

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.primaryBtnText}>
            {loading ? "Creating account…" : "Create Account"}
          </ThemedText>
        </TouchableOpacity>

        {/* Sign in link */}
        <View style={styles.footerRow}>
          <ThemedText style={styles.footerText}>
            Already have an account?{" "}
          </ThemedText>
          <TouchableOpacity onPress={() => onNavigate("signin")}>
            <ThemedText style={styles.link}>Sign In</ThemedText>
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
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#757575",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  termsText: {
    fontSize: 13,
    color: "#0D47A1",
    flex: 1,
    lineHeight: 1.5,
  },
  link: {
    color: "#0288D1",
    fontWeight: "600",
  },
  error: {
    fontSize: 11,
    color: "#E05555",
    marginBottom: 12,
    paddingLeft: 4,
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
});
