import { MXButton } from "@/components/MXButton";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from "@/stores/authStore";
import { colour, space, typography } from "@/tokens";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GRACE_PERIOD_DAYS = 30;

// Shown while profiles.deletion_requested_at is set — the 30-day window
// promised in the Terms/Privacy Policy. supabase/functions/purge-deleted-accounts
// runs daily via pg_cron and permanently deletes the account once the window
// elapses. AuthGate (app/_layout.tsx) redirects here and blocks the rest of
// the app until the user cancels, matching app/access-blocked.tsx's pattern.
export default function AccountPendingDeletionScreen() {
  const router = useRouter();
  const { deletionRequestedAt, cancelAccountDeletion, signOut } = useAuthStore();

  const purgeDate = deletionRequestedAt
    ? new Date(new Date(deletionRequestedAt).getTime() + GRACE_PERIOD_DAYS * 86_400_000)
    : null;
  const purgeDateLabel = purgeDate
    ? purgeDate.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
    : "in 30 days";

  const handleCancel = async () => {
    try {
      await cancelAccountDeletion();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Deletion cancelled", "Your account is safe — welcome back.");
    } catch (e: any) {
      Alert.alert("Something went wrong", e?.message ?? "Please try again.");
    }
  };

  const handleExport = () => {
    router.push("/itr12-export-setup" as any);
  };

  const handleSignOut = () => {
    Alert.alert("Sign out?", "Your account will still be deleted on schedule unless you cancel first.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colour.noir }}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.xl,
          paddingBottom: space.xxxl,
          flexGrow: 1,
        }}
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
          <Text
            style={{
              ...typography.h2,
              fontWeight: "800",
              color: colour.onNoir,
              textAlign: "center",
            }}
          >
            Account Scheduled for Deletion
          </Text>
          <Text
            style={{
              ...typography.bodyM,
              color: colour.onNoir2,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Your account and all your data — expenses, income, mileage and
            receipts — will be permanently deleted on{"\n"}
            <Text style={{ fontWeight: "700", color: colour.onNoir }}>{purgeDateLabel}</Text>.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colour.noir2,
            borderRadius: 16,
            padding: space.lg,
            marginBottom: space.lg,
          }}
        >
          <Text style={{ ...typography.labelM, color: colour.onNoir, marginBottom: space.xs }}>
            Changed your mind?
          </Text>
          <Text style={{ ...typography.bodyS, color: colour.onNoir2, lineHeight: 20 }}>
            Cancel anytime before the deletion date and your account will be
            fully restored, exactly as it was.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colour.noir2,
            borderRadius: 16,
            padding: space.lg,
            marginBottom: space.xxl,
          }}
        >
          <Text style={{ ...typography.labelM, color: colour.onNoir, marginBottom: space.xs }}>
            Want a copy of your data first?
          </Text>
          <Text style={{ ...typography.bodyS, color: colour.onNoir2, lineHeight: 20, marginBottom: space.md }}>
            Export your ITR12-ready records before the deletion date — this
            won't cancel the scheduled deletion.
          </Text>
          <MXButton label="Export My Data" variant="secondary" size="M" onPress={handleExport} fullWidth />
        </View>

        <MXButton label="Cancel Deletion" variant="primary" size="L" onPress={handleCancel} fullWidth />

        <Text
          style={{
            ...typography.bodyXS,
            color: colour.onNoir2,
            opacity: 0.85,
            textAlign: "center",
            marginTop: space.lg,
          }}
          onPress={handleSignOut}
        >
          Sign out
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
