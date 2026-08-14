import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { MXInput } from "@/components/MXInput";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONFIRM_WORD = "DELETE";

const WHAT_GETS_DELETED = [
  "All receipt images and OCR scans",
  "Mileage logs, bank account and home office details",
  "Your name, phone number, tax number and other profile details",
  "Your login — you won't be able to sign back in",
];

export default function DeleteAccountConfirmScreen() {
  const router = useRouter();
  const { requestAccountDeletion } = useAuthStore();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleConfirm = async () => {
    if (!canConfirm || loading) return;
    setLoading(true);
    try {
      await requestAccountDeletion();
      router.replace("/account-pending-deletion" as any);
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Something went wrong", e?.message ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colour.white }}>
      <MXHeader title="Delete Account" showBack />

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", gap: space.xs, marginBottom: space.xl }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colour.dangerBg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space.xs,
            }}
          >
            <IconSymbol name="trash.fill" size={30} color={colour.danger} />
          </View>
          <Text style={{ ...typography.h2, fontWeight: "800", color: colour.text, textAlign: "center" }}>
            This will permanently delete your account
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colour.dangerBg,
            borderRadius: radius.lg,
            padding: space.lg,
            marginBottom: space.lg,
          }}
        >
          <Text style={{ ...typography.labelM, color: colour.danger, marginBottom: space.sm }}>
            This deletes:
          </Text>
          {WHAT_GETS_DELETED.map((item) => (
            <View key={item} style={{ flexDirection: "row", gap: space.sm, marginBottom: space.xs }}>
              <Text style={{ fontSize: 14, color: colour.text }}>•</Text>
              <Text style={{ flex: 1, fontSize: 14, color: colour.text, lineHeight: 20 }}>{item}</Text>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: colour.surface1,
            borderRadius: radius.lg,
            padding: space.lg,
            marginBottom: space.lg,
          }}
        >
          <Text style={{ ...typography.bodyS, color: colour.textSub, lineHeight: 20 }}>
            You'll have <Text style={{ fontWeight: "700", color: colour.text }}>30 days</Text> after
            confirming to export your data or cancel before this takes effect.{"\n\n"}
            Your expense and income transaction records are kept for a further 5 years after that, as
            required by SARS record-keeping rules — everything else above is gone for good.{"\n\n"}
            If you have an active Pro subscription, deleting your account does not cancel it — cancel
            separately via the App Store or Google Play to stop being billed.
          </Text>
        </View>

        <MXInput
          label={`Type ${CONFIRM_WORD} to confirm`}
          placeholder={CONFIRM_WORD}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <View style={{ height: space.xl }} />

        <MXButton
          label={loading ? "Please wait..." : "Delete My Account"}
          variant="danger"
          size="L"
          onPress={handleConfirm}
          disabled={!canConfirm || loading}
          loading={loading}
          fullWidth
        />
        <View style={{ height: space.sm }} />
        <MXButton
          label="Cancel"
          variant="tertiary"
          size="L"
          onPress={() => router.back()}
          disabled={loading}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}
