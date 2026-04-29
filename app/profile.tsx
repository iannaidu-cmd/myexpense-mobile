import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
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
// ─── Profile Screen ────────────────────────────────────────────────────────────
// Dedicated "My Profile" screen showing and editing user details.
// Accessible from Settings → My Profile.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [subscription, setSubscription] = useState("free");

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    profileService
      .getProfile(user.id)
      .then((p) => {
        if (p) {
          setFullName(p.full_name ?? "");
          setBusinessName(p.business_name ?? "");
          setPhone(p.phone ?? "");
          setTaxNumber(p.tax_number ?? "");
          setSubscription(p.subscription ?? "free");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await profileService.updateProfile(user.id, {
        full_name: fullName.trim(),
        business_name: businessName.trim(),
        phone: phone.trim(),
        tax_number: taxNumber.trim(),
      });
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not save profile.");
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
      .slice(0, 2) ||
    (email[0]?.toUpperCase() ?? "?");

  const planLabel =
    subscription === "pro"
      ? "Pro Plan"
      : subscription === "business"
        ? "Business Plan"
        : "Free Plan";

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" />

      <MXHeader
        title="My profile"
        subtitle="Manage your personal details"
        showBack
        backLabel="Settings"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)")
        }
        right={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
            }}
          >
            {saving ? (
              <ActivityIndicator color={colour.white} size="small" />
            ) : (
              <Text style={{ ...typography.labelS, color: colour.accentDeep }}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      {/* ── White card ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colour.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator color={colour.primary} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: space.lg }}
            >
              {/* Avatar */}
              <View style={{ alignItems: "center", marginBottom: space.xl }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colour.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: space.sm,
                  }}
                >
                  <Text style={{ ...typography.h1, color: colour.white }}>
                    {initials}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colour.primary50,
                    borderRadius: radius.pill,
                    paddingHorizontal: space.md,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{ ...typography.captionM, color: colour.primary }}
                  >
                    {planLabel}
                  </Text>
                </View>
              </View>

              {/* Form fields */}
              <View
                style={{
                  backgroundColor: colour.white,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colour.borderLight,
                  overflow: "hidden",
                  marginBottom: space.md,
                }}
              >
                {[
                  {
                    label: "Full Name",
                    value: fullName,
                    setter: setFullName,
                    placeholder: "e.g. Ian Naidu",
                    editable: true,
                  },
                  {
                    label: "Email Address",
                    value: email,
                    setter: setEmail,
                    placeholder: "",
                    editable: false,
                  },
                  {
                    label: "Business / Trading Name",
                    value: businessName,
                    setter: setBusinessName,
                    placeholder: "Optional",
                    editable: true,
                  },
                  {
                    label: "Phone Number",
                    value: phone,
                    setter: setPhone,
                    placeholder: "e.g. 082 123 4567",
                    editable: true,
                  },
                  {
                    label: "SARS Tax Number",
                    value: taxNumber,
                    setter: setTaxNumber,
                    placeholder: "e.g. 1234567890",
                    editable: true,
                  },
                ].map((field, idx, arr) => (
                  <View
                    key={field.label}
                    style={{
                      padding: space.md,
                      borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                      borderBottomColor: colour.borderLight,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.captionM,
                        color: colour.textHint,
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      {field.label}
                    </Text>
                    <TextInput
                      value={field.value}
                      onChangeText={field.editable ? field.setter : undefined}
                      placeholder={field.placeholder}
                      placeholderTextColor={colour.textHint}
                      editable={field.editable}
                      style={{
                        ...typography.bodyM,
                        color: field.editable ? colour.text : colour.textSub,
                        paddingVertical: 4,
                      }}
                      autoCapitalize={
                        field.label === "Email Address" ? "none" : "words"
                      }
                      keyboardType={
                        field.label === "Phone Number"
                          ? "phone-pad"
                          : field.label === "SARS Tax Number"
                            ? "numeric"
                            : "default"
                      }
                    />
                  </View>
                ))}
              </View>

              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.textHint,
                  textAlign: "center",
                  marginBottom: space.xxxl,
                }}
              >
                Your data is protected under POPIA. We never share your personal
                information.
              </Text>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
      <MXTabBar />
    </SafeAreaView>
  );
}
