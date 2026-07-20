import { InfoBanner } from "@/components/InfoBanner";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { SuccessModal } from "@/components/SuccessModal";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { medicalTaxCredit, useTaxProfileStore } from "@/stores/taxProfileStore";
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
  const [successVisible, setSuccessVisible] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [subscription, setSubscription] = useState("free");

  // Tax profile (persisted to AsyncStorage)
  const { profile: taxProfile, isLoaded: taxProfileLoaded, load: loadTaxProfile, save: saveTaxProfile } = useTaxProfileStore();
  const [taxAge, setTaxAge] = useState("");
  const [taxDependants, setTaxDependants] = useState(0);
  const [taxDisability, setTaxDisability] = useState(false);
  const [taxMedContrib, setTaxMedContrib] = useState("");

  useEffect(() => { loadTaxProfile(); }, []);

  useEffect(() => {
    if (!taxProfileLoaded) return;
    setTaxAge(taxProfile.age > 0 ? String(taxProfile.age) : "");
    setTaxDependants(taxProfile.numMedDependants);
    setTaxDisability(taxProfile.hasDisability);
    setTaxMedContrib(taxProfile.medicalAidAnnualContrib > 0 ? String(taxProfile.medicalAidAnnualContrib) : "");
  }, [taxProfileLoaded]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
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
      await Promise.all([
        profileService.updateProfile(user.id, {
          full_name: fullName.trim(),
          business_name: businessName.trim(),
          phone: phone.trim(),
          tax_number: taxNumber.trim(),
        }),
        saveTaxProfile({
          age: parseInt(taxAge) || 0,
          numMedDependants: taxDependants,
          hasDisability: taxDisability,
          medicalAidAnnualContrib: parseFloat(taxMedContrib) || 0,
        }),
      ]);
      setSuccessVisible(true);
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

              {/* ── Tax profile section ────────────────────────────────── */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colour.textSub,
                  letterSpacing: 0.8,
                  marginBottom: space.sm,
                  marginTop: space.lg,
                }}
              >
                TAX PROFILE
              </Text>
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
                {/* Age */}
                <View
                  style={{
                    padding: space.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.borderLight,
                  }}
                >
                  <Text style={{ ...typography.captionM, color: colour.textHint, letterSpacing: 0.5, marginBottom: 4 }}>
                    Age
                  </Text>
                  <TextInput
                    value={taxAge}
                    onChangeText={setTaxAge}
                    placeholder="e.g. 34"
                    placeholderTextColor={colour.textHint}
                    keyboardType="number-pad"
                    style={{ ...typography.bodyM, color: colour.text, paddingVertical: 4 }}
                  />
                </View>

                {/* Medical aid dependants */}
                <View
                  style={{
                    padding: space.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.borderLight,
                  }}
                >
                  <Text style={{ ...typography.captionM, color: colour.textHint, letterSpacing: 0.5, marginBottom: space.sm }}>
                    Medical aid dependants (excluding yourself)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                    <TouchableOpacity
                      onPress={() => setTaxDependants((v) => Math.max(0, v - 1))}
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: colour.surface2,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, color: colour.text, lineHeight: 24 }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: colour.text, minWidth: 28, textAlign: "center" }}>
                      {taxDependants}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setTaxDependants((v) => Math.min(10, v + 1))}
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: colour.surface2,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, color: colour.text, lineHeight: 24 }}>+</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 12, color: colour.textSub, flex: 1 }}>
                      {taxDependants === 0 ? "just yourself" : taxDependants === 1 ? "1 dependant" : `${taxDependants} dependants`}
                    </Text>
                  </View>
                </View>

                {/* Disability */}
                <View
                  style={{
                    padding: space.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.borderLight,
                  }}
                >
                  <Text style={{ ...typography.captionM, color: colour.textHint, letterSpacing: 0.5, marginBottom: space.sm }}>
                    Disability (you or a dependant)
                  </Text>
                  <View style={{ flexDirection: "row", gap: space.sm }}>
                    {[
                      { label: "No disability", value: false },
                      { label: "Yes — disability", value: true },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={String(opt.value)}
                        onPress={() => setTaxDisability(opt.value)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: radius.md,
                          borderWidth: 1.5,
                          borderColor: taxDisability === opt.value ? colour.primary : colour.borderLight,
                          backgroundColor: taxDisability === opt.value ? colour.primary50 : colour.white,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: taxDisability === opt.value ? colour.accentDeep : colour.textSub,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Medical aid annual contributions */}
                <View style={{ padding: space.md }}>
                  <Text style={{ ...typography.captionM, color: colour.textHint, letterSpacing: 0.5, marginBottom: 4 }}>
                    Annual medical aid contributions (R)
                  </Text>
                  <TextInput
                    value={taxMedContrib}
                    onChangeText={setTaxMedContrib}
                    placeholder="0"
                    placeholderTextColor={colour.textHint}
                    keyboardType="decimal-pad"
                    style={{ ...typography.bodyM, color: colour.text, paddingVertical: 4 }}
                  />
                  <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 4 }}>
                    Total contributions you pay to your medical aid per year
                  </Text>
                </View>
              </View>

              {/* Live credit preview */}
              {(() => {
                const credit = medicalTaxCredit(taxDependants);
                const age = parseInt(taxAge) || 0;
                return (
                  <View
                    style={{
                      backgroundColor: colour.noir,
                      borderRadius: radius.md,
                      padding: space.md,
                      marginBottom: space.md,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: colour.onNoir2, marginBottom: space.sm }}>
                      ESTIMATED MEDICAL TAX CREDIT (S6A)
                    </Text>
                    <Text style={{ fontSize: 26, fontWeight: "800", color: colour.onNoir, letterSpacing: -0.5, marginBottom: 2 }}>
                      {`R ${credit.toLocaleString("en-ZA")}`}
                      <Text style={{ fontSize: 13, fontWeight: "400", color: colour.onNoir2 }}> /year</Text>
                    </Text>
                    <Text style={{ fontSize: 11, color: colour.onNoir2, marginBottom: 6 }}>
                      {taxDependants === 0
                        ? "Main member: R4,368"
                        : taxDependants === 1
                          ? "Main member + 1 dependant: R4,368 + R4,368"
                          : `Main member + ${taxDependants} dependants`}
                    </Text>
                    {taxDisability && (
                      <View style={{ backgroundColor: colour.primary, borderRadius: radius.sm, padding: space.sm, marginTop: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: colour.white }}>
                          Disability: qualifying out-of-pocket medical expenses are fully deductible (no 7.5% floor). Attach ITR-DD from SARS.
                        </Text>
                      </View>
                    )}
                    {age >= 65 && (
                      <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.sm, padding: space.sm, marginTop: 4 }}>
                        <Text style={{ fontSize: 11, color: colour.onNoir2 }}>
                          Age 65+: excess medical expenses are fully deductible without the 7.5% threshold.
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              <InfoBanner
                icon="info.circle.fill"
                body="These details are used to compute your medical tax credit in the tax summary screen. They are stored locally on your device only."
                style={{ marginBottom: space.md }}
              />

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

      <SuccessModal
        visible={successVisible}
        title="Profile saved"
        message="Your profile has been updated."
        primaryLabel="Done"
        onPrimary={() => setSuccessVisible(false)}
      />
    </SafeAreaView>
  );
}
