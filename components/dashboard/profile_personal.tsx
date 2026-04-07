import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Field Input ──────────────────────────────────────────────────────────────
function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
  note,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  editable?: boolean;
  note?: string;
}) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text
        style={{
          ...typography.labelS,
          color: colour.textSub,
          marginBottom: space.xs,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colour.textHint}
        keyboardType={keyboardType ?? "default"}
        editable={editable}
        style={{
          ...typography.bodyM,
          color: editable ? colour.text : colour.textSub,
          borderBottomWidth: 1.5,
          borderBottomColor: editable ? colour.primary : colour.border,
          paddingBottom: space.sm,
          paddingTop: space.xxs,
          backgroundColor: "transparent",
        }}
      />
      {note ? (
        <Text
          style={{
            ...typography.bodyXS,
            color: colour.textSub,
            marginTop: space.xxs,
          }}
        >
          {note}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfilePersonalScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  const [fullName, setFullName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [workType, setWorkType] = useState("");

  // Split full_name into first/last for display
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") ?? "";

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const profile = await profileService.getProfile(user.id);
        if (profile) {
          setFullName(profile.full_name ?? "");
          setTaxNumber(profile.tax_number ?? "");
          setWorkType(profile.work_type ?? "Sole proprietor / freelancer");
        }
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const wrap = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setEdited(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await profileService.updateProfile(user.id, {
        full_name: fullName,
        tax_number: taxNumber,
        work_type: workType,
      });
      setEdited(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colour.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colour.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colour.primary,
            paddingHorizontal: space.lg,
            paddingTop: space.lg,
            paddingBottom: space["3xl"],
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: space.sm }}
          >
            <Text
              style={{ ...typography.bodyS, color: "rgba(255,255,255,0.8)" }}
            >
              ‹ Settings
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              ...typography.captionM,
              color: colour.tealLight,
              letterSpacing: 1,
            }}
          >
            SETTINGS
          </Text>
          <Text
            style={{
              ...typography.h2,
              fontWeight: "800",
              color: colour.onPrimary,
              marginTop: space.xxs,
            }}
          >
            Profile & Personal
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colour.background,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            marginTop: -20,
            paddingBottom: space["3xl"],
          }}
        >
          {/* Avatar */}
          <View
            style={{
              alignItems: "center",
              paddingTop: space.xl,
              paddingBottom: space.lg,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colour.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: colour.teal,
              }}
            >
              <Text
                style={{
                  ...typography.h3,
                  color: colour.onPrimary,
                  fontWeight: "800",
                }}
              >
                {initials}
              </Text>
            </View>
            <Text
              style={{
                ...typography.bodyS,
                color: colour.textSub,
                marginTop: space.xs,
              }}
            >
              {user?.email}
            </Text>
          </View>

          {/* Personal Details */}
          <View
            style={{
              backgroundColor: colour.surface1,
              marginHorizontal: space.lg,
              borderRadius: radius.lg,
              padding: space.lg,
              borderWidth: 1,
              borderColor: colour.borderLight,
              marginBottom: space.md,
            }}
          >
            <Text
              style={{
                ...typography.bodyM,
                fontWeight: "700",
                color: colour.text,
                marginBottom: space.md,
              }}
            >
              Personal Details
            </Text>
            <View style={{ flexDirection: "row", gap: space.md }}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="First name"
                  value={firstName}
                  onChangeText={(v) =>
                    wrap(setFullName)(`${v} ${lastName}`.trim())
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="Last name"
                  value={lastName}
                  onChangeText={(v) =>
                    wrap(setFullName)(`${firstName} ${v}`.trim())
                  }
                />
              </View>
            </View>
            <FieldInput
              label="Email address"
              value={user?.email ?? ""}
              editable={false}
              note="Email cannot be changed here. Contact support."
            />
          </View>

          {/* Tax & Business */}
          <View
            style={{
              backgroundColor: colour.surface1,
              marginHorizontal: space.lg,
              borderRadius: radius.lg,
              padding: space.lg,
              borderWidth: 1,
              borderColor: colour.borderLight,
              marginBottom: space.md,
            }}
          >
            <Text
              style={{
                ...typography.bodyM,
                fontWeight: "700",
                color: colour.text,
                marginBottom: space.md,
              }}
            >
              Tax & Business Info
            </Text>
            <FieldInput
              label="SARS tax number"
              value={taxNumber}
              onChangeText={wrap(setTaxNumber)}
              keyboardType="numeric"
              placeholder="10-digit SARS reference"
              note="Your 10-digit SARS taxpayer reference number."
            />
            <FieldInput
              label="Employment type"
              value={workType || "Sole proprietor / freelancer"}
              onChangeText={wrap(setWorkType)}
              placeholder="e.g. Sole Proprietor / Freelancer"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={{
              marginHorizontal: space.lg,
              backgroundColor: edited ? colour.primary : colour.surface2,
              borderRadius: radius.lg,
              padding: space.md,
              alignItems: "center",
            }}
            disabled={!edited || saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator color={colour.onPrimary} />
            ) : (
              <Text
                style={{
                  ...typography.bodyM,
                  fontWeight: "700",
                  color: edited ? colour.onPrimary : colour.textSub,
                }}
              >
                {edited ? "Save changes" : "No changes"}
              </Text>
            )}
          </TouchableOpacity>

          {/* POPIA Note */}
          <Text
            style={{
              ...typography.bodyXS,
              color: colour.textSub,
              textAlign: "center",
              marginTop: space.lg,
              marginHorizontal: space.xl,
              lineHeight: 18,
            }}
          >
            🔒 Your personal information is protected under POPIA.{"\n"}
            MyExpense will never sell or share your data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
