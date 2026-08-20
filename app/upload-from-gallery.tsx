import { AnnouncementModal } from "@/components/AnnouncementModal";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FREE_SCAN_LIMIT, scanAllowanceNoticeKey } from "@/constants/freeTier";
import { receiptState } from "@/lib/receiptState";
import { receiptService } from "@/services/receiptService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function UploadFromGalleryScreen() {
  const router = useRouter();
  const { user, isPremium, isInitialised, refreshPremiumStatus } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [premiumChecked, setPremiumChecked] = useState(false);
  const [scanBlocked, setScanBlocked] = useState(false);
  const [scanGateReady, setScanGateReady] = useState(false);
  const [showAllowanceNotice, setShowAllowanceNotice] = useState(false);

  // Refresh premium status before deciding whether the free-tier scan cap applies.
  useEffect(() => {
    if (!isInitialised || !user) return;
    refreshPremiumStatus().finally(() => setPremiumChecked(true));
  }, [isInitialised, user]);

  // Enforce the free-tier scan cap (shared with scan-receipt-camera.tsx — a
  // gallery upload spends a scan exactly like a camera capture does).
  // Fails open on a count-check error — a network blip shouldn't block a scan.
  useEffect(() => {
    if (!premiumChecked || !user) return;
    if (isPremium) {
      setScanGateReady(true);
      return;
    }
    receiptService
      .countThisMonth(user.id)
      .then((count) => {
        if (count >= FREE_SCAN_LIMIT) setScanBlocked(true);
      })
      .catch(() => {})
      .finally(() => setScanGateReady(true));
  }, [premiumChecked, isPremium, user]);

  // Once-per-calendar-month heads-up telling free users their scan allowance
  // — shared AsyncStorage key with scan-receipt-camera.tsx, so it only ever
  // shows once a month regardless of which entry point the user reaches first.
  useEffect(() => {
    if (!scanGateReady || isPremium || scanBlocked) return;
    AsyncStorage.getItem(scanAllowanceNoticeKey()).then((seen) => {
      if (!seen) setShowAllowanceNotice(true);
    });
  }, [scanGateReady, isPremium, scanBlocked]);

  const dismissAllowanceNotice = () => {
    setShowAllowanceNotice(false);
    AsyncStorage.setItem(scanAllowanceNoticeKey(), "1").catch(() => {});
  };

  const openPicker = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library in Settings to upload receipts.",
        [{ text: "OK", onPress: () => router.back() }],
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
    });
    if (result.canceled) {
      router.back();
      return;
    }
    setPickedUri(result.assets[0].uri);
  }, [router]);

  useEffect(() => {
    if (!scanGateReady || scanBlocked) return;
    openPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanGateReady, scanBlocked]);

  const handleUpload = async () => {
    if (!pickedUri || !user) return;
    setUploading(true);
    try {
      const fileName = `receipt_${Date.now()}.jpg`;
      const storagePath = `${user.id}/receipts/${fileName}`;

      const manipulated = await ImageManipulator.manipulateAsync(
        pickedUri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
      );

      const uploadResponse = await fetch(manipulated.uri);
      const arrayBuffer = await uploadResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { supabase } = await import("@/lib/supabase");

      const UPLOAD_TIMEOUT_MS = 60_000;
      const uploadTimeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Upload timed out. Please check your connection and try again.")),
          UPLOAD_TIMEOUT_MS,
        ),
      );

      const { error: uploadError } = await Promise.race([
        supabase.storage.from("receipts").upload(storagePath, uint8Array, {
          upsert: true,
          contentType: "image/jpeg",
        }),
        uploadTimeout,
      ]);
      if (uploadError) throw new Error(uploadError.message);

      await supabase.from("receipts").insert({
        user_id: user.id,
        storage_path: storagePath,
        file_name: fileName,
        ocr_status: "pending",
      });

      // Convert to base64 for receiptState
      const b64Response = await fetch(manipulated.uri);
      const b64Blob = await b64Response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl);
        };
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(b64Blob);
      });

      // Pass local URI for preview — bucket is private so no public URL is generated
      receiptState.set(base64, manipulated.uri, storagePath);
      router.push("/scan-receipt-processing" as any);
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message ?? "Could not upload receipt.");
    } finally {
      setUploading(false);
    }
  };

  if (!scanGateReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colour.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colour.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (scanBlocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
        <MXHeader title="Upload receipt" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={[typography.bodyM, { fontWeight: "800", fontSize: 20, color: colour.text, marginBottom: 12, textAlign: "center" }]}>
            Monthly Scan Limit Reached
          </Text>
          <Text style={[typography.bodyS, { color: colour.textSub, textAlign: "center", marginBottom: 32 }]}>
            Free accounts get {FREE_SCAN_LIMIT} receipt scans a month. Upgrade to Pro for unlimited scanning, or add this expense manually.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/paywall-upgrade" as any)}
            style={{ backgroundColor: colour.primary, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 32 }}
          >
            <Text style={[typography.btnL, { color: colour.textOnPrimary }]}>Upgrade to Pro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/add-expense" as any)}
            style={{ marginTop: 16 }}
          >
            <Text style={[typography.bodyS, { color: colour.textSub }]}>Add manually instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show a loading state while the picker is opening
  if (!pickedUri) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colour.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
        <ActivityIndicator color={colour.textOnPrimary} size="large" />
        <Text
          style={[
            typography.bodyM,
            { color: "rgba(255,255,255,0.75)", marginTop: space.md },
          ]}
        >
          Opening gallery…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader title="Upload receipt" showBack />

      {/* Card */}
      <View
        style={{
          flex: 1,
          backgroundColor: colour.bgCard,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          marginTop: -2,
          padding: space.lg,
        }}
      >
        {/* Preview */}
        <Image
          source={{ uri: pickedUri }}
          style={{
            width: "100%",
            flex: 1,
            borderRadius: radius.md,
            marginBottom: space.lg,
          }}
          resizeMode="contain"
        />

        {/* Tips */}
        <View
          style={{
            backgroundColor: colour.primaryLight,
            borderRadius: radius.md,
            padding: space.md,
            marginBottom: space.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
              marginBottom: space.xs,
            }}
          >
            <IconSymbol name="list.bullet.clipboard.fill" size={14} color={colour.primary} />
            <Text style={[typography.labelS, { color: colour.primary }]}>
              Tips for best results
            </Text>
          </View>
          <Text style={[typography.bodyS, { color: colour.primary }]}>
            • Ensure the receipt is fully visible and well-lit{"\n"}• Avoid
            blurry or dark images{"\n"}• JPEG and PNG formats are supported
          </Text>
        </View>

        {/* Choose different + Upload */}
        <TouchableOpacity
          onPress={openPicker}
          style={{
            borderRadius: radius.pill,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: colour.primary,
            marginBottom: space.sm,
          }}
        >
          <Text style={[typography.btnM, { color: colour.primary }]}>
            Choose Different Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={uploading}
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.md,
          }}
        >
          {uploading ? (
            <ActivityIndicator color={colour.textOnPrimary} />
          ) : (
            <Text style={[typography.btnL, { color: colour.textOnPrimary }]}>
              Upload receipt
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <MXTabBar />

      <AnnouncementModal
        visible={showAllowanceNotice}
        icon="camera.fill"
        iconColour={colour.primary}
        eyebrow="Free plan"
        title={`You have ${FREE_SCAN_LIMIT} free scans this month`}
        subtitle="Free accounts can scan up to this many receipts a month. Upgrade to Pro anytime for unlimited scanning."
        primaryLabel="Got it"
        onPrimary={dismissAllowanceNotice}
        onClose={dismissAllowanceNotice}
      />
    </SafeAreaView>
  );
}
