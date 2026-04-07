// ─── Profile Setup Screen ─────────────────────────────────────────────────────
// Shown once after first sign-in when the user has no tax number on record.
// Collects the minimum details SARS requires: tax number, work type, name.
// ─────────────────────────────────────────────────────────────────────────────

import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
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

const WORK_TYPES = [
  { id: "sole", label: "Sole proprietor" },
  { id: "freelancer", label: "Freelancer" },
  { id: "contractor", label: "Independent contractor" },
  { id: "employed", label: "Salaried employee" },
  { id: "other", label: "Other" },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [workType, setWorkType] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    taxNumber?: string;
    workType?: string;
  }>({});

  // Pre-fill whatever is already on the profile
  useEffect(() => {
    if (!user) return;
    profileService
      .getProfile(user.id)
      .then((p) => {
        if (p?.full_name) setFullName(p.full_name);
        if (p?.work_type) setWorkType(p.work_type);
        if (p?.tax_number) setTaxNumber(p.tax_number);
        if ((p as any)?.phone) setPhone((p as any).phone);
      })
      .catch(() => {});
  }, [user]);

  const validate = () => {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    const tn = taxNumber.replace(/\s/g, "");
    if (!tn) {
      e.taxNumber = "Income tax number is required";
    } else if (!/^\d{10}$/.test(tn)) {
      e.taxNumber = "SARS tax number must be exactly 10 digits";
    }
    if (!workType) e.workType = "Please select your work type";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await profileService.updateProfile(user.id, {
        full_name: fullName.trim(),
        tax_number: taxNumber.replace(/\s/g, ""),
        work_type: workType,
        ...(phone.trim() ? ({ phone: phone.trim() } as any) : {}),
      });
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message ?? "Could not save profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: space.lg,
              paddingTop: space["2xl"],
              paddingBottom: space["3xl"],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: space.lg,
                gap: space.md,
              }}
            >
              {/* Step dots */}
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: i === 3 ? 22 : 6,
                      height: 6,
                      borderRadius: radius.pill,
                      backgroundColor:
                        i === 3
                          ? "rgba(255,255,255,0.95)"
                          : "rgba(255,255,255,0.35)",
                    }}
                  />
                ))}
              </View>
              <Text
                style={{
                  ...typography.caption,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Step 4 of 4
              </Text>
            </View>

            <Text
              style={{
                ...typography.h2,
                fontWeight: "800",
                color: colour.onPrimary,
                marginBottom: space.xs,
              }}
            >
              Complete your{"\n"}tax profile
            </Text>
            <Text
              style={{ ...typography.bodyM, color: "rgba(255,255,255,0.75)" }}
            >
              SARS requires your income tax number to process ITR12 deductions.
              This is stored securely and never shared.
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
            {/* Full Name */}
            <Text
              style={{
                ...typography.labelM,
                color: colour.textSub,
                marginBottom: space.xs,
              }}
            >
              Full name
            </Text>
            <TextInput
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              placeholder="e.g. Ian Naidu"
              placeholderTextColor={colour.textHint}
              style={{
                ...typography.bodyM,
                color: colour.text,
                borderBottomWidth: 1.5,
                borderBottomColor: errors.fullName
                  ? colour.danger
                  : colour.border,
                paddingVertical: space.sm,
                marginBottom: errors.fullName ? space.xs : space.xl,
              }}
            />
            {errors.fullName && (
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.danger,
                  marginBottom: space.md,
                }}
              >
                {errors.fullName}
              </Text>
            )}

            {/* SARS Tax Number */}
            <Text
              style={{
                ...typography.labelM,
                color: colour.textSub,
                marginBottom: space.xs,
              }}
            >
              Income tax number (SARS)
            </Text>
            <TextInput
              value={taxNumber}
              onChangeText={(t) => {
                setTaxNumber(t.replace(/[^0-9]/g, "").slice(0, 10));
                setErrors((e) => ({ ...e, taxNumber: undefined }));
              }}
              placeholder="10-digit number e.g. 1234567890"
              placeholderTextColor={colour.textHint}
              keyboardType="number-pad"
              maxLength={10}
              style={{
                ...typography.bodyM,
                color: colour.text,
                borderBottomWidth: 1.5,
                borderBottomColor: errors.taxNumber
                  ? colour.danger
                  : colour.border,
                paddingVertical: space.sm,
                marginBottom: errors.taxNumber ? space.xs : 4,
                letterSpacing: 2,
              }}
            />
            {errors.taxNumber ? (
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.danger,
                  marginBottom: space.md,
                }}
              >
                {errors.taxNumber}
              </Text>
            ) : (
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.textHint,
                  marginBottom: space.xl,
                }}
              >
                Find this on your SARS eFiling profile or IRP5.
              </Text>
            )}

            {/* Phone (optional) */}
            <Text
              style={{
                ...typography.labelM,
                color: colour.textSub,
                marginBottom: space.xs,
              }}
            >
              Phone number{" "}
              <Text style={{ color: colour.textHint, fontWeight: "400" }}>
                (optional)
              </Text>
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+27 82 000 0000"
              placeholderTextColor={colour.textHint}
              keyboardType="phone-pad"
              style={{
                ...typography.bodyM,
                color: colour.text,
                borderBottomWidth: 1.5,
                borderBottomColor: colour.border,
                paddingVertical: space.sm,
                marginBottom: space.xl,
              }}
            />

            {/* Work Type */}
            <Text
              style={{
                ...typography.labelM,
                color: colour.textSub,
                marginBottom: space.sm,
              }}
            >
              Work type
            </Text>
            {errors.workType && (
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.danger,
                  marginBottom: space.sm,
                }}
              >
                {errors.workType}
              </Text>
            )}
            <View
              style={{
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: errors.workType ? colour.danger : colour.border,
                marginBottom: space["2xl"],
                overflow: "hidden",
              }}
            >
              {WORK_TYPES.map((wt, i) => (
                <TouchableOpacity
                  key={wt.id}
                  onPress={() => {
                    setWorkType(wt.id);
                    setErrors((e) => ({ ...e, workType: undefined }));
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: space.md,
                    paddingHorizontal: space.lg,
                    borderBottomWidth: i < WORK_TYPES.length - 1 ? 1 : 0,
                    borderBottomColor: colour.border,
                    backgroundColor:
                      workType === wt.id ? colour.primaryLight : colour.white,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor:
                        workType === wt.id ? colour.primary : colour.border,
                      backgroundColor:
                        workType === wt.id ? colour.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: space.md,
                    }}
                  >
                    {workType === wt.id && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colour.white,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      ...typography.bodyM,
                      color: workType === wt.id ? colour.primary : colour.text,
                      fontWeight: workType === wt.id ? "700" : "400",
                    }}
                  >
                    {wt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SARS info callout */}
            <View
              style={{
                backgroundColor: colour.infoLight ?? "#EAF4FF",
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space["2xl"],
                flexDirection: "row",
                gap: space.sm,
              }}
            >
              <Text style={{ fontSize: 18 }}>🔒</Text>
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.info ?? colour.primary,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                Your tax number is encrypted and stored securely. It is only
                used to pre-fill your ITR12 export — we never share it with
                third parties.
              </Text>
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
              style={{
                backgroundColor: saving ? colour.border : colour.primary,
                borderRadius: radius.pill,
                height: 56,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: space.md,
              }}
            >
              {saving ? (
                <ActivityIndicator color={colour.white} />
              ) : (
                <Text style={{ ...typography.btnL, color: colour.white }}>
                  Save & continue
                </Text>
              )}
            </TouchableOpacity>

            {/* Skip link */}
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              style={{
                alignItems: "center",
                paddingVertical: space.sm,
                marginBottom: space.lg,
              }}
            >
              <Text style={{ ...typography.bodyS, color: colour.textHint }}>
                Skip for now — I'll add this later in Settings
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
