import { showNotice } from "@/components/NoticeHost";
// ─── Profile Setup Screen ─────────────────────────────────────────────────────
// Shown once per account per device when the profile has no work type (see
// ProfileSetupPrompt in app/_layout.tsx). Name and work type are required;
// the tax number is optional since many new users won't have it to hand.
// ─────────────────────────────────────────────────────────────────────────────

import { IconSymbol } from "@/components/ui/icon-symbol";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { useVehicleStore } from "@/stores/vehicleStore";
import { colour, radius, space, typography } from "@/tokens";
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
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// Shared with the tax rules that depend on it (see lib/workType.ts).
import { WORK_TYPES } from "@/lib/workType";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    if (tn && !/^\d{10}$/.test(tn)) {
      e.taxNumber = "Your tax number should be 10 digits";
    }
    if (!workType) e.workType = "Please choose how you work";
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
      const tn = taxNumber.replace(/\s/g, "");
      await profileService.updateProfile(user.id, {
        full_name: fullName.trim(),
        work_type: workType,
        ...(tn ? { tax_number: tn } : {}),
        ...(phone.trim() ? ({ phone: phone.trim() } as any) : {}),
      });
      useAuthStore.setState({ needsProfileSetup: false });
      // Work type decides whether vehicle wear & tear can be claimed
      // (lib/workType.ts), so recompute it, and the Home estimate with it.
      useVehicleStore.getState().syncWearAndTear(user.id, useExpenseStore.getState().activeTaxYear);
      router.replace("/(tabs)");
    } catch {
      showNotice({ title: "Couldn't save your profile", message: "Please check your internet connection and try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.heroDark }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.heroDark} />
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
              paddingHorizontal: space.lg,
              paddingTop: space["2xl"],
              paddingBottom: space["3xl"],
            }}
          >
            <Text
              style={{
                ...typography.h2,
                fontWeight: "800",
                color: colour.onNoir,
                marginBottom: space.xs,
              }}
            >
              Tell us about{"\n"}your work
            </Text>
            <Text style={{ ...typography.bodyM, color: colour.onNoir2 }}>
              This helps us work out what you can claim. It only takes a minute.
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
              placeholder="e.g. Jessica Taylor"
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
              SARS tax number{" "}
              <Text style={{ color: colour.textHint, fontFamily: typography.bodyS.fontFamily }}>
                (optional)
              </Text>
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
                {"It's on your eFiling profile or your IRP5. You can add it later."}
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
              <Text style={{ color: colour.textHint, fontFamily: typography.bodyS.fontFamily }}>
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
              How do you work?
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
                backgroundColor: colour.primary + "17",
                borderWidth: 1,
                borderColor: colour.primary + "29",
                borderRadius: radius.note,
                padding: space.md,
                marginBottom: space["2xl"],
                flexDirection: "row",
                gap: space.sm,
              }}
            >
              <IconSymbol name="lock.fill" size={18} color={colour.primary} />
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.text,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                Your details are stored securely. Your tax number is only used
                to fill in your tax export. We never share it.
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
                marginBottom: space.lg + insets.bottom,
              }}
            >
              <Text style={{ ...typography.bodyS, color: colour.textHint }}>
                Skip for now. You can add this later under Me → My profile.
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
