import { signInWithGoogle } from "@/services/googleAuthService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";

// ── Facebook logo ─────────────────────────────────────────────────────────────
function FacebookLogo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect width="24" height="24" rx="12" fill="#1877F2" />
      <Path
        d="M16.5 12H14v-1.5c0-.69.31-1 1-1h1.5V7H14c-2.21 0-3 1.5-3 3v2H9v2.5h2V21h2.5v-6.5H16l.5-2.5z"
        fill="white"
      />
    </Svg>
  );
}

// ── Google logo ───────────────────────────────────────────────────────────────
function GoogleLogo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <ClipPath id="clipGSU">
          <Rect width="24" height="24" rx="12" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clipGSU)">
        <Path d="M21.8 12.2c0-.7-.06-1.37-.17-2.02H12v3.82h5.5a4.7 4.7 0 01-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.44z" fill="#4285F4" />
        <Path d="M12 22c2.76 0 5.08-.92 6.77-2.48l-3.3-2.56c-.92.62-2.08.98-3.47.98-2.67 0-4.93-1.8-5.73-4.22H2.87v2.64A10 10 0 0012 22z" fill="#34A853" />
        <Path d="M6.27 13.72A6.02 6.02 0 016 12c0-.6.1-1.18.27-1.72V7.64H2.87A10 10 0 002 12c0 1.61.38 3.13 1.05 4.48l3.22-2.76z" fill="#FBBC05" />
        <Path d="M12 5.8c1.5 0 2.85.52 3.9 1.53l2.93-2.93C17.07 2.72 14.76 1.8 12 1.8a10 10 0 00-9.13 5.84l3.4 2.64C7.07 7.6 9.33 5.8 12 5.8z" fill="#EA4335" />
      </G>
    </Svg>
  );
}

// ── Social icon button ────────────────────────────────────────────────────────
function SocialIconButton({ icon, onPress, disabled, loading, label }: {
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityLabel={`Sign up with ${label}`}
      style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: colour.white,
        borderWidth: 1.5, borderColor: colour.border,
        alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
        ...Platform.select({
          ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
          android: { elevation: 3 },
        }),
      }}
    >
      {loading
        ? <ActivityIndicator color={colour.textSecondary} size="small" />
        : icon
      }
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuthStore();

  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [agreed, setAgreed]               = useState(false);
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbLoading, setFbLoading]   = useState(false);
  const [errors, setErrors]               = useState<{
    name?: string; email?: string; password?: string; agree?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (!agreed) e.agree = "You must accept the terms to continue";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      await signUp(email, password, name.trim());
      router.push({ pathname: "/email-verification", params: { email } });
    } catch (err: any) {
      setErrors({ email: err.message ?? "Could not create account. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.replace("/(tabs)");
      } else if (result.error !== "cancelled") {
        Alert.alert("Google Sign-In failed", result.error ?? "Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setFbLoading(true);
    try {
      Alert.alert("Coming Soon", "Facebook Sign-In will be available in the next update.");
    } finally {
      setFbLoading(false);
    }
  };

  const socialDisabled = loading || googleLoading || fbLoading;

  const passwordStrength =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["transparent", colour.danger, colour.warning, colour.primary];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ backgroundColor: colour.primary, paddingHorizontal: space.lg, paddingTop: space["2xl"], paddingBottom: space["3xl"] }}>
            <Text style={{ ...typography.h2, fontWeight: "800", color: colour.onPrimary, marginBottom: space.xs }}>
              Create account
            </Text>
            <Text style={{ ...typography.bodyM, color: "rgba(255,255,255,0.75)" }}>
              Join 3.8 million self-employed South Africans maximising their tax deductions.
            </Text>
          </View>

          {/* Card */}
          <View style={{ flex: 1, backgroundColor: colour.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -20, padding: space.lg, paddingTop: space["2xl"] }}>

            {/* Full name */}
            <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.xs }}>FULL NAME</Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder="e.g. Ian Naidu" placeholderTextColor={colour.textHint}
              style={{ ...typography.bodyM, color: colour.text, borderBottomWidth: 1.5, borderBottomColor: errors.name ? colour.danger : colour.border, paddingVertical: space.sm, marginBottom: errors.name ? space.xs : space.lg }}
            />
            {errors.name && <Text style={{ ...typography.bodyXS, color: colour.danger, marginBottom: space.md }}>{errors.name}</Text>}

            {/* Email */}
            <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.xs }}>EMAIL ADDRESS</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="you@example.co.za" placeholderTextColor={colour.textHint}
              keyboardType="email-address" autoCapitalize="none"
              style={{ ...typography.bodyM, color: colour.text, borderBottomWidth: 1.5, borderBottomColor: errors.email ? colour.danger : colour.border, paddingVertical: space.sm, marginBottom: errors.email ? space.xs : space.lg }}
            />
            {errors.email && <Text style={{ ...typography.bodyXS, color: colour.danger, marginBottom: space.md }}>{errors.email}</Text>}

            {/* Password */}
            <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.xs }}>PASSWORD</Text>
            <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1.5, borderBottomColor: errors.password ? colour.danger : colour.border, marginBottom: errors.password ? space.xs : space.sm }}>
              <TextInput
                value={password} onChangeText={setPassword}
                placeholder="Min. 8 characters" placeholderTextColor={colour.textHint}
                secureTextEntry={!showPassword}
                style={{ ...typography.bodyM, flex: 1, color: colour.text, paddingVertical: space.sm }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: space.xs }}>
                <Text style={{ ...typography.labelS, color: colour.primary }}>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={{ ...typography.bodyXS, color: colour.danger, marginBottom: space.sm }}>{errors.password}</Text>}

            {/* Password strength */}
            {password.length > 0 && (
              <View style={{ marginBottom: space.lg }}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: strengthColors[passwordStrength], marginBottom: 4 }} />
                <Text style={{ ...typography.bodyXS, color: colour.textSub, fontWeight: "600" }}>{strengthLabels[passwordStrength]}</Text>
              </View>
            )}

            {/* Terms checkbox */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: space.sm }}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 6,
                borderWidth: 1.5,
                borderColor: agreed ? colour.primary : colour.border,
                backgroundColor: agreed ? colour.primary : "transparent",
                justifyContent: "center", alignItems: "center",
                marginTop: 2, flexShrink: 0,
              }}>
                {agreed && <Text style={{ fontSize: 12, fontWeight: "700", color: colour.white }}>✓</Text>}
              </View>
              {/* Terms text — links navigate in-app */}
              <Text style={{ ...typography.bodyS, color: colour.textSub, flex: 1, lineHeight: 20 }}>
                {"I agree to the "}
                <Text
                  style={{ color: colour.primary, fontWeight: "600" }}
                  onPress={() => router.push("/terms")}
                >
                  Terms of Service
                </Text>
                {" and "}
                <Text
                  style={{ color: colour.primary, fontWeight: "600" }}
                  onPress={() => router.push("/privacy")}
                >
                  Privacy Policy
                </Text>
                {". Your data is protected under POPIA."}
              </Text>
            </TouchableOpacity>
            {errors.agree && <Text style={{ ...typography.bodyXS, color: colour.danger, marginBottom: space.md }}>{errors.agree}</Text>}

            {/* Create account button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || socialDisabled}
              style={{ backgroundColor: (loading || socialDisabled) ? colour.border : colour.primary, borderRadius: radius.pill, height: 52, alignItems: "center", justifyContent: "center", marginBottom: space.xl, marginTop: space.md }}
            >
              {loading
                ? <ActivityIndicator color={colour.onPrimary} />
                : <Text style={{ ...typography.btnL, color: colour.onPrimary }}>Create Account</Text>
              }
            </TouchableOpacity>

            {/* Social sign-up */}
            <View style={{ alignItems: "center", marginBottom: space.xl }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: space.lg, width: "100%" }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colour.border }} />
                <Text style={{ ...typography.caption, color: colour.textSecondary, paddingHorizontal: space.md }}>or sign up with</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colour.border }} />
              </View>
              <View style={{ flexDirection: "row", gap: space.xl, justifyContent: "center" }}>
                <SocialIconButton label="Facebook"  icon={<FacebookLogo size={24} />} onPress={handleFacebookSignIn}  loading={fbLoading}  disabled={socialDisabled} />
                <SocialIconButton label="Google" icon={<GoogleLogo size={24} />}             onPress={handleGoogleSignIn} loading={googleLoading} disabled={socialDisabled} />
              </View>
            </View>

            {/* Sign in link */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text style={{ ...typography.bodyM, color: colour.textSub }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/sign-in")}>
                <Text style={{ ...typography.bodyM, color: colour.primary, fontWeight: "700" }}>Sign In</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
