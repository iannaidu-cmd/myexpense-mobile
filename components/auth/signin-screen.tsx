import { MXInput } from "@/components/MXInput";
import { supabase } from "@/lib/supabase";
import {
    authenticateWithBiometrics,
    clearBiometricSession,
    getBiometricLabel,
    getBiometricSession,
    isBiometricAvailable,
    isBiometricEnabled,
    saveBiometricSession,
    setBiometricEnabled,
} from "@/services/biometricService";
import { signInWithGoogle } from "@/services/googleAuthService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";

// ── Google logo ───────────────────────────────────────────────────────────────
function GoogleLogo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <ClipPath id="clipGSI">
          <Rect width="24" height="24" rx="12" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clipGSI)">
        <Path
          d="M21.8 12.2c0-.7-.06-1.37-.17-2.02H12v3.82h5.5a4.7 4.7 0 01-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.44z"
          fill="#4285F4"
        />
        <Path
          d="M12 22c2.76 0 5.08-.92 6.77-2.48l-3.3-2.56c-.92.62-2.08.98-3.47.98-2.67 0-4.93-1.8-5.73-4.22H2.87v2.64A10 10 0 0012 22z"
          fill="#34A853"
        />
        <Path
          d="M6.27 13.72A6.02 6.02 0 016 12c0-.6.1-1.18.27-1.72V7.64H2.87A10 10 0 002 12c0 1.61.38 3.13 1.05 4.48l3.22-2.76z"
          fill="#FBBC05"
        />
        <Path
          d="M12 5.8c1.5 0 2.85.52 3.9 1.53l2.93-2.93C17.07 2.72 14.76 1.8 12 1.8a10 10 0 00-9.13 5.84l3.4 2.64C7.07 7.6 9.33 5.8 12 5.8z"
          fill="#EA4335"
        />
      </G>
    </Svg>
  );
}

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

// ── Social icon button ────────────────────────────────────────────────────────
function SocialIconButton({
  icon,
  onPress,
  disabled,
  loading,
  label,
}: {
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
      accessibilityLabel={`Sign in with ${label}`}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colour.white,
        borderWidth: 1.5,
        borderColor: colour.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
          },
          android: { elevation: 3 },
        }),
      }}
    >
      {loading ? (
        <ActivityIndicator color={colour.textSecondary} size="small" />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export function SigninScreen() {
  const router = useRouter();
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      const label = await getBiometricLabel();
      setBiometricAvailable(available);
      setBiometricEnabledState(enabled);
      setBiometricLabel(label);
      // Auto-trigger if session exists
      if (available && enabled) {
        const session = await getBiometricSession();
        if (session) handleBiometricLogin();
      }
    })();
  }, []);

  // ── Biometric login ───────────────────────────────────────────────────────
  // 1. Prompt biometric (fingerprint/face)
  // 2. Load stored access_token + refresh_token from SecureStore
  // 3. Call supabase.auth.setSession() to restore the full session
  // 4. Manually update the authStore user state
  // 5. Navigate — AuthGate now sees a valid user
  const handleBiometricLogin = async () => {
    const authenticated = await authenticateWithBiometrics(
      "Sign in to MyExpense",
    );
    if (!authenticated) return;

    const stored = await getBiometricSession();
    if (!stored) {
      Alert.alert("Session expired", "Please sign in with your password.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: stored.accessToken,
        refresh_token: stored.refreshToken,
      });

      if (error || !data.session?.user) {
        // Tokens are fully expired — clear and ask for password
        await clearBiometricSession();
        await setBiometricEnabled(false);
        setBiometricEnabledState(false);
        Alert.alert(
          "Session expired",
          "Please sign in with your email and password to re-enable biometric login.",
        );
        return;
      }

      // Manually update the auth store so AuthGate is satisfied immediately
      const { user } = data.session;
      useAuthStore.setState({
        user: { id: user.id, email: user.email ?? "" },
        isAuthenticated: true,
      });

      // Save the refreshed tokens for next time
      await saveBiometricSession(
        user.email ?? stored.email,
        data.session.access_token,
        data.session.refresh_token,
      );

      router.replace("/(tabs)");
    } catch {
      Alert.alert(
        "Sign in failed",
        "Please sign in with your email and password.",
      );
    }
  };

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signIn(email, password);

      // Offer biometrics after first successful password login
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      if (available && !enabled) {
        Alert.alert(
          `Enable ${biometricLabel}?`,
          `Use ${biometricLabel} to sign in faster next time.`,
          [
            {
              text: "Not now",
              style: "cancel",
              onPress: () => router.replace("/(tabs)"),
            },
            {
              text: "Enable",
              onPress: async () => {
                const {
                  data: { session: s },
                } = await supabase.auth.getSession();
                if (s?.access_token && s?.refresh_token) {
                  // Store BOTH tokens so biometric login can fully restore session
                  await saveBiometricSession(
                    email,
                    s.access_token,
                    s.refresh_token,
                  );
                  await setBiometricEnabled(true);
                  setBiometricEnabledState(true);
                }
                router.replace("/(tabs)");
              },
            },
          ],
        );
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setErrors({ password: "Invalid email or password. Please try again." });
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
        Alert.alert(
          "Google Sign-In failed",
          result.error ?? "Please try again.",
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setFbLoading(true);
    try {
      Alert.alert(
        "Coming Soon",
        "Facebook Sign-In will be available in the next update.",
      );
    } finally {
      setFbLoading(false);
    }
  };

  const socialDisabled = loading || googleLoading || fbLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
              Welcome back
            </Text>
            <Text
              style={{ ...typography.bodyM, color: "rgba(255,255,255,0.75)" }}
            >
              Sign in to your MyExpense account and pick up where you left off.
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
            {/* Email */}
            <View style={{ marginBottom: space.lg }}>
              <MXInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.co.za"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: space.xs }}>
              <MXInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry={!showPassword}
                trailingIcon={
                  <Text style={{ fontSize: 18 }}>
                    {showPassword ? "🙈" : "👁️"}
                  </Text>
                }
                onTrailingPress={() => setShowPassword(!showPassword)}
                error={errors.password}
              />
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => router.push("/forgot-password")}
              style={{
                alignSelf: "flex-start",
                minHeight: 44,
                justifyContent: "center",
                marginBottom: space["2xl"],
                marginTop: space.sm,
              }}
            >
              <Text
                style={{
                  ...typography.bodyS,
                  color: colour.primary,
                  fontWeight: "600",
                }}
              >
                Forgot your password?
              </Text>
            </TouchableOpacity>

            {/* Sign in button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || socialDisabled}
              style={{
                backgroundColor:
                  loading || socialDisabled ? colour.border : colour.primary,
                borderRadius: radius.pill,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: space.xl,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colour.onPrimary} />
              ) : (
                <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Biometric button — shown for both fingerprint and Face ID */}
            {biometricAvailable && biometricEnabled && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                style={{
                  borderWidth: 1.5,
                  borderColor: colour.primary,
                  borderRadius: radius.pill,
                  height: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: space.sm,
                  marginBottom: space.xl,
                }}
              >
                <Text style={{ fontSize: 22 }}>
                  {biometricLabel === "Face ID" ? "🔐" : "👆"}
                </Text>
                <Text style={{ ...typography.btnL, color: colour.primary }}>
                  Sign in with {biometricLabel}
                </Text>
              </TouchableOpacity>
            )}

            {/* Social divider */}
            <View style={{ alignItems: "center", marginBottom: space.xl }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: space.lg,
                  width: "100%",
                }}
              >
                <View
                  style={{ flex: 1, height: 1, backgroundColor: colour.border }}
                />
                <Text
                  style={{
                    ...typography.caption,
                    color: colour.textSecondary,
                    paddingHorizontal: space.md,
                  }}
                >
                  or sign in with
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: colour.border }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: space.xl,
                  justifyContent: "center",
                }}
              >
                <SocialIconButton
                  label="Facebook"
                  icon={<FacebookLogo size={24} />}
                  onPress={handleFacebookSignIn}
                  loading={fbLoading}
                  disabled={socialDisabled}
                />
                <SocialIconButton
                  label="Google"
                  icon={<GoogleLogo size={24} />}
                  onPress={handleGoogleSignIn}
                  loading={googleLoading}
                  disabled={socialDisabled}
                />
              </View>
            </View>

            {/* Create account */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text style={{ ...typography.bodyM, color: colour.textSub }}>
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/sign-up")}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text
                  style={{
                    ...typography.bodyM,
                    color: colour.primary,
                    fontWeight: "700",
                  }}
                >
                  Create one
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
