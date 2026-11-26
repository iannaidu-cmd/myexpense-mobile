import { showNotice } from "@/components/NoticeHost";
import * as AppleAuthentication from "expo-apple-authentication";
import { signInWithApple } from "@/services/appleAuthService";
import { signInWithFacebook } from "@/services/facebookAuthService";
import { signInWithGoogle } from "@/services/googleAuthService";
import { errorText, trackFunnel, trackOAuthResult } from "@/services/funnelService";
import { logSignUp } from "@/lib/analytics";
import { logMetaRegistration } from "@/lib/metaAttribution";
import { notePendingTermsConsent, useAuthStore } from "@/stores/authStore";
import { colour, radius } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Polyline, Rect } from "react-native-svg";

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
      <Defs><ClipPath id="gsu"><Rect width="24" height="24" rx="12" /></ClipPath></Defs>
      <G clipPath="url(#gsu)">
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
  autoComplete, trailing, onTrailingPress, hint, error, height = 50,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: any;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoCorrect?: boolean; autoComplete?: any;
  trailing?: React.ReactNode; onTrailingPress?: () => void;
  hint?: string; error?: string; height?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colour.textMid, letterSpacing: 0.1, marginBottom: 5 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: colour.white,
        borderRadius: radius.md, height,
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
      {hint && !error && (
        <Text style={{ fontSize: 12, color: colour.textHint, marginTop: 4, letterSpacing: 0.1 }}>{hint}</Text>
      )}
      {error && (
        <Text style={{ fontSize: 12, color: colour.danger, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}

// ── Social button (half width, sits beside its partner) ──────────────────────
function SocialButton({ icon, onPress, disabled, loading, label, height }: {
  icon: React.ReactNode; onPress: () => void;
  disabled?: boolean; loading?: boolean; label: string; height: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled} activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${label}`}
      style={{
        flex: 1, height, borderRadius: radius.pill,
        backgroundColor: colour.white,
        borderWidth: 1, borderColor: colour.borderLight,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: disabled ? 0.5 : 1,
        ...Platform.select({
          ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
          android: { elevation: 1 },
        }),
      }}
    >
      {loading ? <ActivityIndicator color={colour.textSub} size="small" /> : (
        <>
          {icon}
          <Text style={{ fontSize: 15, fontWeight: "600", color: colour.text }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // The whole form must fit with no scrolling (keyboard aside), so short
  // screens like the iPhone SE get tighter spacing.
  const { height: screenH } = useWindowDimensions();
  const compact = screenH < 760;
  const ctl = compact ? 46 : 50; // height of every button and field
  const { signUp } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [termsPrompt, setTermsPrompt] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  // Consent is required before any sign-up. The buttons stay tappable so they
  // don't look broken; tapping one unticked shows why instead of starting.
  const needsTerms = (via: "apple" | "google" | "facebook" | "email") => {
    if (agreed) return false;
    setTermsPrompt(true);
    trackFunnel("terms_prompt", { via });
    return true;
  };

  const handleSubmit = async () => {
    if (needsTerms("email")) return;
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Full name is required.";
    if (!email.includes("@")) e.email = "Enter a valid email address.";
    if (password.length < 8) e.password = "Use at least 8 characters.";
    if (Object.keys(e).length) {
      trackFunnel("sign_up_invalid", { fields: Object.keys(e) });
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    trackFunnel("sign_up_submit", { method: "email" });
    // Only reached once "I agree" is ticked (needsTerms above). Saved to the profile
    // after sign-in (see notePendingTermsConsent in authStore).
    await notePendingTermsConsent();
    try {
      await signUp(email, password, name.trim());
      trackFunnel("sign_up_ok", { method: "email" });
      logMetaRegistration("email");
      logSignUp("email");
      // AuthGate handles routing: pendingEmailVerification → email-verification,
      // or isAuthenticated → tabs (when email confirmation is disabled).
    } catch (err: any) {
      trackFunnel("sign_up_failed", { method: "email", error: errorText(err) });
      setErrors({ email: err.message ?? "Could not create account. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (needsTerms("google")) return;
    setGoogleLoading(true);
    await notePendingTermsConsent();
    trackFunnel("oauth_start", { provider: "google", from: "sign-up" });
    try {
      const result = await signInWithGoogle();
      trackOAuthResult("google", "sign-up", result);
      if (result.success) {
        logMetaRegistration("google");
        logSignUp("google");
        router.replace("/(tabs)");
      }
      else if (result.error !== "cancelled") showNotice({ title: "Couldn't sign in with Google", message: "Please try again." });
    } finally { setGoogleLoading(false); }
  };

  const handleFacebookSignIn = async () => {
    if (needsTerms("facebook")) return;
    setFbLoading(true);
    await notePendingTermsConsent();
    trackFunnel("oauth_start", { provider: "facebook", from: "sign-up" });
    try {
      const result = await signInWithFacebook();
      trackOAuthResult("facebook", "sign-up", result);
      if (result.success) {
        logMetaRegistration("facebook");
        logSignUp("facebook");
      }
      if (!result.success && result.error !== "cancelled") showNotice({ title: "Couldn't sign in with Facebook", message: "Please try again." });
    } finally { setFbLoading(false); }
  };

  const handleAppleSignIn = async () => {
    if (needsTerms("apple")) return;
    setAppleLoading(true);
    await notePendingTermsConsent();
    trackFunnel("oauth_start", { provider: "apple", from: "sign-up" });
    try {
      const result = await signInWithApple();
      trackOAuthResult("apple", "sign-up", result);
      if (result.success) {
        logMetaRegistration("apple");
        logSignUp("apple");
        router.replace("/(tabs)");
      }
      else if (result.error !== "cancelled") showNotice({ title: "Couldn't sign in with Apple", message: "Please try again." });
    } finally { setAppleLoading(false); }
  };

  const socialDisabled = loading || googleLoading || fbLoading || appleLoading;
  const ctaDisabled = socialDisabled;

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>

          {/* ── Periwinkle header ── */}
          <View style={{
            backgroundColor: colour.primary,
            paddingTop: insets.top + 10,
            paddingHorizontal: 24,
            paddingBottom: compact ? 30 : 36,
            overflow: "hidden",
          }}>
            <View style={{ position: "absolute", top: -46, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.10)" }} />
            <View style={{ position: "absolute", top: 34, right: 42, width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.08)" }} />

            {!compact && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: -0.2 }}>MyExpense</Text>
              </View>
            )}

            <Text style={{ fontSize: compact ? 24 : 26, fontWeight: "800", color: "#fff", letterSpacing: -0.5, lineHeight: compact ? 29 : 31, marginBottom: 6 }}>
              Create account
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: "rgba(255,255,255,0.82)", maxWidth: 300 }}>
              Start with 12 free uses. No card needed.
            </Text>
          </View>

          {/* ── Cream card ── */}
          <View style={{
            flex: 1, backgroundColor: colour.background,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            marginTop: -24, paddingHorizontal: 24, paddingTop: compact ? 20 : 24, paddingBottom: compact ? 12 : 20,
          }}>

            {/* Consent checkbox (first, so it's seen before any button) */}
            <TouchableOpacity
              onPress={() => {
                if (!agreed) {
                  trackFunnel("terms_ticked");
                  setTermsPrompt(false);
                }
                setAgreed(a => !a);
              }}
              activeOpacity={0.8}
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
            >
              <View style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
                alignItems: "center", justifyContent: "center",
                backgroundColor: agreed ? colour.primary : colour.white,
                borderWidth: 1.5,
                borderColor: agreed ? colour.primary : termsPrompt ? colour.danger : colour.border,
              }}>
                {agreed && (
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                    <Polyline points="20 6 9 17 4 12" stroke="white" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
              <Text style={{ fontSize: 12.5, lineHeight: 18, color: colour.textSub, flex: 1 }}>
                {"I agree to the "}
                <Text style={{ color: colour.primary, fontWeight: "600" }} onPress={() => router.push("/terms")}>
                  Terms of Service
                </Text>
                {" and "}
                <Text style={{ color: colour.primary, fontWeight: "600" }} onPress={() => router.push("/privacy")}>
                  Privacy Policy
                </Text>
                {". Your data is protected under POPIA."}
              </Text>
            </TouchableOpacity>
            {termsPrompt && !agreed && (
              <Text style={{ fontSize: 12.5, lineHeight: 16, fontWeight: "600", color: colour.danger, marginTop: 6, marginLeft: 34 }}>
                Tick the box to agree before you continue.
              </Text>
            )}

            {/* Social sign-up first: no email confirmation step */}
            <View style={{ gap: 10, marginTop: termsPrompt && !agreed ? 8 : compact ? 14 : 18 }}>
              {Platform.OS === "ios" && appleAvailable && (
                <View pointerEvents={socialDisabled ? "none" : "auto"} style={{ opacity: socialDisabled ? 0.5 : 1 }}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={ctl / 2}
                    style={{ width: "100%", height: ctl }}
                    onPress={handleAppleSignIn}
                  />
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <SocialButton label="Google" icon={<GoogleLogo />} onPress={handleGoogleSignIn} loading={googleLoading} disabled={socialDisabled} height={ctl} />
                <SocialButton label="Facebook" icon={<FacebookLogo />} onPress={handleFacebookSignIn} loading={fbLoading} disabled={socialDisabled} height={ctl} />
              </View>
            </View>

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: compact ? 12 : 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colour.borderLight }} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colour.textSub, paddingHorizontal: 14, letterSpacing: 0.2 }}>
                or use your email
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colour.borderLight }} />
            </View>

            {/* Fields */}
            <View style={{ gap: compact ? 10 : 14 }}>
              <AuthField
                label="Full name" value={name} onChangeText={setName}
                placeholder="e.g. Jessica Taylor" autoCapitalize="words"
                autoCorrect={false} autoComplete="name" error={errors.name} height={ctl}
              />
              <AuthField
                label="Email address" value={email} onChangeText={setEmail}
                placeholder="you@example.co.za" keyboardType="email-address"
                autoComplete="email" error={errors.email} height={ctl}
              />
              <AuthField
                label="Password" value={password} onChangeText={setPassword}
                placeholder="At least 8 characters" secureTextEntry={!showPassword}
                autoComplete="new-password" height={ctl}
                trailing={<EyeIcon off={showPassword} />}
                onTrailingPress={() => setShowPassword(s => !s)}
                error={errors.password}
              />
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSubmit} disabled={ctaDisabled} activeOpacity={0.85}
              style={{
                backgroundColor: colour.primary, borderRadius: radius.pill, height: ctl + 2,
                alignItems: "center", justifyContent: "center", marginTop: compact ? 14 : 18,
                opacity: ctaDisabled ? 0.45 : 1,
                ...(!ctaDisabled ? Platform.select({
                  ios: { shadowColor: colour.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 18 },
                  android: { elevation: 4 },
                }) : {}),
              }}
            >
              {loading ? <ActivityIndicator color={colour.onPrimary} /> : (
                <Text style={{ fontSize: 16, fontWeight: "700", color: colour.onPrimary, letterSpacing: 0.2 }}>Create account</Text>
              )}
            </TouchableOpacity>

            {/* Spacer + footer */}
            <View style={{ flex: 1, minHeight: 12 }} />
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 14, color: colour.textSub }}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace("/sign-in")} activeOpacity={0.7}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colour.primary }}>Sign in</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
