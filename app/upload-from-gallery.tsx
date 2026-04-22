import { MXHeader } from "@/components/MXHeader";
import { receiptState } from "@/lib/receiptState";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
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
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
    openPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(storagePath, uint8Array, {
          upsert: true,
          contentType: "image/jpeg",
        });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader title="Upload Receipt" showBack />

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
          <Text
            style={[
              typography.labelS,
              { color: colour.primary, marginBottom: space.xs },
            ]}
          >
            📋 Tips for best results
          </Text>
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
            marginBottom: Math.max(insets.bottom, space.md),
          }}
        >
          {uploading ? (
            <ActivityIndicator color={colour.textOnPrimary} />
          ) : (
            <Text style={[typography.btnL, { color: colour.textOnPrimary }]}>
              Upload Receipt
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
