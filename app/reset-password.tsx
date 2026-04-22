import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const rules = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "One number", pass: /[0-9]/.test(password) },
  ];

  const handleReset = async () => {
    if (!password || !confirm) {
      setError("Please fill in both fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setDone(true);
    } catch {
      setError("Reset link may have expired. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View
            style={{
              paddingHorizontal: space.lg,
              paddingTop: space["2xl"],
              paddingBottom: space["3xl"],
            }}
          >
            {!done && (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginBottom: space.lg }}
              >
                <Text
                  style={{
                    color: colour.textOnPrimary,
                    fontSize: 26,
                    lineHeight: 30,
                  }}
                >
                  ‹
                </Text>
              </TouchableOpacity>
            )}
            <Text
              style={[typography.heading2, { color: colour.textOnPrimary }]}
            >
              {done ? "Password updated" : "New password"}
            </Text>
            <Text
              style={[
                typography.bodyM,
                { color: "rgba(255,255,255,0.75)", marginTop: space.xs },
              ]}
            >
              {done
                ? "You can now sign in with your new password"
                : "Choose a strong password for your account"}
            </Text>
          </View>

          {/* ── Card ── */}
          <View
            style={{
              flex: 1,
              backgroundColor: colour.bgCard,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: space.lg,
              paddingTop: space["2xl"],
            }}
          >
            {done ? (
              <View style={{ alignItems: "center", paddingTop: space["3xl"] }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: colour.successLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: space.xl,
                  }}
                >
                  <IconSymbol name="lock.fill" size={32} color={colour.success} />
                </View>
                <Text
                  style={[
                    typography.heading3,
                    {
                      color: colour.textPrimary,
                      textAlign: "center",
                      marginBottom: space.sm,
                    },
                  ]}
                >
                  All done!
                </Text>
                <Text
                  style={[
                    typography.bodyM,
                    {
                      color: colour.textSecondary,
                      textAlign: "center",
                      marginBottom: space["3xl"],
                    },
                  ]}
                >
                  Your password has been reset successfully.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/sign-in" as any)}
                  style={{
                    backgroundColor: colour.primary,
                    borderRadius: radius.pill,
                    height: 52,
                    paddingHorizontal: space["4xl"],
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={[typography.btnL, { color: colour.textOnPrimary }]}
                  >
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* New password */}
                <Text
                  style={[
                    typography.labelM,
                    { color: colour.textSecondary, marginBottom: space.xs },
                  ]}
                >
                  New password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderBottomWidth: 1.5,
                    borderBottomColor: colour.border,
                    marginBottom: space.md,
                  }}
                >
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min. 8 characters"
                    placeholderTextColor={colour.textHint}
                    secureTextEntry={!showPass}
                    style={[
                      typography.bodyM,
                      {
                        flex: 1,
                        color: colour.textPrimary,
                        paddingVertical: space.sm,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    style={{ padding: space.xs }}
                  >
                    <Text
                      style={[typography.labelS, { color: colour.primary }]}
                    >
                      {showPass ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Password strength rules */}
                <View style={{ marginBottom: space.lg }}>
                  {rules.map((r) => (
                    <View
                      key={r.label}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: space.xs,
                      }}
                      aria-label={r.label}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: r.pass
                            ? colour.success
                            : colour.border,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: space.sm,
                        }}
                      >
                        {r.pass && (
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: "700",
                            }}
                          >
                            ✓
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: r.pass
                              ? colour.success
                              : colour.textSecondary,
                          },
                        ]}
                      >
                        {r.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Confirm */}
                <Text
                  style={[
                    typography.labelM,
                    { color: colour.textSecondary, marginBottom: space.xs },
                  ]}
                >
                  Confirm new password
                </Text>
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Re-enter password"
                  placeholderTextColor={colour.textHint}
                  secureTextEntry={!showPass}
                  style={[
                    typography.bodyM,
                    {
                      color: colour.textPrimary,
                      borderBottomWidth: 1.5,
                      borderBottomColor: colour.border,
                      paddingVertical: space.sm,
                      marginBottom: space["2xl"],
                    },
                  ]}
                />

                {error ? (
                  <View
                    style={{
                      backgroundColor: colour.dangerLight,
                      borderRadius: radius.sm,
                      padding: space.md,
                      marginBottom: space.lg,
                    }}
                  >
                    <Text style={[typography.bodyS, { color: colour.danger }]}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleReset}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? colour.border : colour.primary,
                    borderRadius: radius.pill,
                    height: 52,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={colour.textOnPrimary} />
                  ) : (
                    <Text
                      style={[typography.btnL, { color: colour.textOnPrimary }]}
                    >
                      Reset password
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
