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
import { signInWithFacebook } from "@/services/facebookAuthService";
import { signInWithGoogle } from "@/services/googleAuthService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from "react-native-svg";

// ── Eye icon ──────────────────────────────────────────────────────────────────
function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        stroke={colour.textSub} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
      <Line x1="1" y1="1" x2="23" y2="23" stroke={colour.textSub} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  ) : (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={colour.textSub} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={colour.textSub} strokeWidth={1.8} />
    </Svg>
  );
}

// ── Google logo ───────────────────────────────────────────────────────────────
function GoogleLogo() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Defs><ClipPath id="gsi"><Rect width="24" height="24" rx="12" /></ClipPath></Defs>
      <G clipPath="url(#gsi)">
        <Path d="M21.8 12.2c0-.7-.06-1.37-.17-2.02H12v3.82h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.44z" fill="#4285F4" />
        <Path d="M12 22c2.76 0 5.08-.92 6.77-2.48l-3.3-2.56c-.92.62-2.08.98-3.47.98-2.67 0-4.93-1.8-5.73-4.22H2.87v2.64A10 10 0 0 0 12 22z" fill="#34A853" />
        <Path d="M6.27 13.72A6.02 6.02 0 0 1 6 12c0-.6.1-1.18.27-1.72V7.64H2.87A10 10 0 0 0 2 12c0 1.61.38 3.13 1.05 4.48l3.22-2.76z" fill="#FBBC05" />
        <Path d="M12 5.8c1.5 0 2.85.52 3.9 1.53l2.93-2.93C17.07 2.72 14.76 1.8 12 1.8a10 10 0 0 0-9.13 5.84l3.4 2.64C7.07 7.6 9.33 5.8 12 5.8z" fill="#EA4335" />
      </G>
    </Svg>
  );
}

// ── Facebook logo ─────────────────────────────────────────────────────────────
function FacebookLogo() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="12" fill="#1877F2" />
      <Path d="M16.5 12H14v-1.5c0-.69.31-1 1-1h1.5V7H14c-2.21 0-3 1.5-3 3v2H9v2.5h2V21h2.5v-6.5H16l.5-2.5z" fill="white" />
    </Svg>
  );
}

// ── Form field with focus ring ─────────────────────────────────────────────────
function AuthField({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize = "none", autoCorrect = false,
  autoComplete, trailing, onTrailingPress, error,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: any;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoCorrect?: boolean; autoComplete?: any;
  trailing?: React.ReactNode; onTrailingPress?: () => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colour.textMid, letterSpacing: 0.1, marginBottom: 7 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: colour.white,
        borderRadius: radius.md, height: 54,
        paddingHorizontal: 15,
        borderWidth: focused ? 1.5 : 1,
        borderColor: focused ? colour.primary : colour.borderLight,
        ...Platform.select({
          ios: focused
            ? { shadowColor: colour.primary50, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 }
            : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
          android: {},
        }),
      }}>
        <TextInput
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor={colour.textHint} secureTextEntry={secureTextEntry}
          keyboardType={keyboardType} autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, fontSize: 16, fontWeight: "500", color: colour.text, paddingVertical: 0 }}
        />
        {trailing && (
          <TouchableOpacity onPress={onTrailingPress} hitSlop={8} activeOpacity={0.7}>
            {trailing}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: colour.danger, marginTop: 6 }}>{error}</Text>
      )}
    </View>
  );
}

// ── Social button ─────────────────────────────────────────────────────────────
function SocialButton({ icon, onPress, disabled, loading, label }: {
  icon: React.ReactNode; onPress: () => void;
  disabled?: boolean; loading?: boolean; label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled} activeOpacity={0.8}
      accessibilityLabel={`Sign in with ${label}`}
      style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: colour.white,
        borderWidth: 1, borderColor: colour.borderLight,
        alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
        ...Platform.select({
          ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
          android: { elevation: 1 },
        }),
      }}
    >
      {loading ? <ActivityIndicator color={colour.textSub} size="small" /> : icon}
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export function SigninScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
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
      if (available && enabled) {
        const stored = await getBiometricSession();
        if (stored) handleBiometricLogin(true);
      }
    })();
  }, []);

  const handleBiometricLogin = async (auto = false) => {
    const authenticated = await authenticateWithBiometrics("Sign in to MyExpense");
    if (!authenticated) return;
    try {
      const stored = await getBiometricSession();
      if (!stored) {
        if (!auto) Alert.alert("Setup required", "Please sign in with your email and password once to activate fingerprint login.");
        return;
      }
      const { data, error } = await supabase.auth.setSession({
        access_token: stored.accessToken,
        refresh_token: stored.refreshToken,
      });
      if (error || !data.session?.user) {
        await clearBiometricSession();
        Alert.alert("Sign in with password", "Your session has expired. Sign in once with your email and password — fingerprint will reactivate automatically.");
        return;
      }
      await saveBiometricSession(data.session.user.email ?? stored.email, data.session.access_token, data.session.refresh_token);
      useAuthStore.setState({ user: { id: data.session.user.id, email: data.session.user.email ?? "" }, isAuthenticated: true });
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Sign in failed", "Please sign in with your email and password.");
    }
  };

  const handleSubmit = async () => {
    const e: typeof errors = {};
    if (!email.includes("@")) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      await signIn(email, password);
      const available = await isBiometricAvailable();
      const alreadyEnabled = await isBiometricEnabled();
      if (available) {
        const { data: sd } = await supabase.auth.getSession();
        if (sd.session) await saveBiometricSession(email, sd.session.access_token, sd.session.refresh_token);
      }
      if (available && !alreadyEnabled) {
        Alert.alert(`Enable ${biometricLabel}?`, `Use ${biometricLabel} to sign in faster next time.`, [
          { text: "Not now", style: "cancel", onPress: () => router.replace("/(tabs)") },
          { text: "Enable", onPress: async () => { await setBiometricEnabled(true); setBiometricEnabledState(true); router.replace("/(tabs)"); } },
        ]);
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
      if (result.success) router.replace("/(tabs)");
      else if (result.error !== "cancelled") Alert.alert("Google Sign-In failed", result.error ?? "Please try again.");
    } finally { setGoogleLoading(false); }
  };

  const handleFacebookSignIn = async () => {
    setFbLoading(true);
    try {
      const result = await signInWithFacebook();
      if (!result.success && result.error !== "cancelled") Alert.alert("Facebook Sign-In failed", result.error ?? "Please try again.");
    } finally { setFbLoading(false); }
  };

  const socialDisabled = loading || googleLoading || fbLoading;

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Periwinkle header ── */}
          <View style={{
            backgroundColor: colour.primary,
            paddingTop: insets.top + 10,
            paddingHorizontal: 24,
            paddingBottom: 40,
            overflow: "hidden",
          }}>
            {/* Decorative blobs */}
            <View style={{ position: "absolute", top: -46, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.10)" }} />
            <View style={{ position: "absolute", top: 34, right: 42, width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.08)" }} />

            {/* Logo lockup */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: -0.2 }}>MyExpense</Text>
            </View>

            <Text style={{ fontSize: 27, fontWeight: "800", color: "#fff", letterSpacing: -0.5, lineHeight: 32, marginBottom: 8 }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: "rgba(255,255,255,0.82)", maxWidth: 300 }}>
              Sign in to your MyExpense account and pick up where you left off.
            </Text>
          </View>

          {/* ── Cream card ── */}
          <View style={{
            flex: 1, backgroundColor: colour.background,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            marginTop: -24, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 28,
          }}>

            {/* Fields */}
            <View style={{ gap: 20 }}>
              <AuthField
                label="Email address" value={email} onChangeText={setEmail}
                placeholder="you@example.co.za" keyboardType="email-address"
                autoComplete="email" error={errors.email}
              />
              <View style={{ gap: 10 }}>
                <AuthField
                  label="Password" value={password} onChangeText={setPassword}
                  placeholder="Your password" secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  trailing={<EyeIcon off={showPassword} />}
                  onTrailingPress={() => setShowPassword(s => !s)}
                  error={errors.password}
                />
                <TouchableOpacity onPress={() => router.push("/forgot-password")} activeOpacity={0.7} style={{ alignSelf: "flex-end" }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colour.primary }}>Forgot your password?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSubmit} disabled={loading || socialDisabled}
              activeOpacity={0.85}
              style={{
                backgroundColor: colour.primary, borderRadius: 100, height: 56,
                alignItems: "center", justifyContent: "center", marginTop: 24,
                opacity: loading || socialDisabled ? 0.7 : 1,
                ...Platform.select({
                  ios: { shadowColor: colour.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 18 },
                  android: { elevation: 4 },
                }),
              }}
            >
              {loading ? <ActivityIndicator color={colour.onPrimary} /> : (
                <Text style={{ fontSize: 16, fontWeight: "700", color: colour.onPrimary, letterSpacing: 0.2 }}>Sign in</Text>
              )}
            </TouchableOpacity>

            {/* Biometric */}
            {biometricAvailable && biometricEnabled && (
              <TouchableOpacity
                onPress={() => handleBiometricLogin(false)} activeOpacity={0.85}
                style={{
                  borderWidth: 1.5, borderColor: colour.primary, borderRadius: 100,
                  height: 56, alignItems: "center", justifyContent: "center", marginTop: 12,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colour.primary, letterSpacing: 0.2 }}>
                  Sign in with {biometricLabel}
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 18 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colour.borderLight }} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colour.textSub, paddingHorizontal: 14, letterSpacing: 0.2 }}>
                or sign in with
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colour.borderLight }} />
            </View>

            {/* Social buttons */}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
              <SocialButton label="Google" icon={<GoogleLogo />} onPress={handleGoogleSignIn} loading={googleLoading} disabled={socialDisabled} />
              <SocialButton label="Facebook" icon={<FacebookLogo />} onPress={handleFacebookSignIn} loading={fbLoading} disabled={socialDisabled} />
            </View>

            {/* Spacer + footer */}
            <View style={{ flex: 1, minHeight: 24 }} />
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 14, color: colour.textSub }}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.replace("/sign-up")} activeOpacity={0.7}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colour.primary }}>Create one</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
