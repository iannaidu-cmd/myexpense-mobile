import { MXButton } from "@/components/MXButton";
import { MXCard } from "@/components/MXCard";
import { MXHeader } from "@/components/MXHeader";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { colour, space, typography } from "@/tokens";
import { useEffect } from "react";
import { Alert, Linking, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Shown when a paid subscription's renewal payment failed and the 7-day
// grace period (see GRACE_PERIOD_DAYS in stores/authStore.ts) has lapsed.
// AuthGate (app/_layout.tsx) redirects here whenever isAccessBlocked is true
// and blocks the gesture-based back-swipe, so this is the only route
// available until payment is fixed or the user signs out.
export default function AccessBlockedScreen() {
  const { signOut } = useAuthStore();
  const { customerInfo, refresh } = useSubscriptionStore();

  useEffect(() => {
    refresh().catch(console.warn);
  }, []);

  const handleUpdatePayment = () => {
    const url = customerInfo?.managementURL;
    if (url) {
      Linking.openURL(url);
      return;
    }
    Alert.alert(
      "Update payment method",
      Platform.OS === "ios"
        ? "Open Settings → Apple ID → Subscriptions to update your payment method for MyExpense."
        : "Open Play Store → Payments & subscriptions to update your payment method for MyExpense."
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in once your payment is up to date.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colour.white }}>
      <MXHeader title="Payment Issue" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.xl,
          paddingBottom: space.xxxl,
          gap: space.lg,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", gap: space.xs }}>
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
            <IconSymbol name="exclamationmark.triangle.fill" size={32} color={colour.danger} />
          </View>
          <Text
            style={{
              ...typography.h2,
              fontWeight: "800",
              color: colour.text,
              textAlign: "center",
            }}
          >
            Access Paused
          </Text>
          <Text
            style={{
              ...typography.bodyM,
              color: colour.textSub,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            We could not process your last subscription payment, and the 7-day
            grace period has ended. Update your payment method to continue
            using MyExpense.
          </Text>
        </View>

        <MXCard>
          <Text style={{ ...typography.labelM, color: colour.text, marginBottom: space.xs }}>
            What happens next
          </Text>
          <Text style={{ ...typography.bodyS, color: colour.textSub, lineHeight: 20 }}>
            Once your payment method is updated and the next renewal succeeds,
            access is restored automatically — usually within a few minutes.
            Your expense, income and mileage data is safe and untouched.
          </Text>
        </MXCard>
      </ScrollView>

      <View
        style={{
          backgroundColor: colour.white,
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: space.lg,
          borderTopWidth: 1,
          borderTopColor: colour.borderLight,
          gap: space.sm,
        }}
      >
        <MXButton
          label="Update Payment Method"
          variant="primary"
          size="L"
          onPress={handleUpdatePayment}
          fullWidth
        />
        <MXButton label="Sign Out" variant="tertiary" size="L" onPress={handleSignOut} fullWidth />
      </View>
    </SafeAreaView>
  );
}
