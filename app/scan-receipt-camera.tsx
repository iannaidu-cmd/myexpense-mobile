import { receiptState } from "@/lib/receiptState";
import { useAuthStore } from "@/stores/authStore";
import { colour } from "@/tokens";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const C = colour;

function CornerBrackets({
  color = C.teal,
  size = 28,
  thickness = 3,
}: {
  color?: string;
  size?: number;
  thickness?: number;
}) {
  const s = (top: boolean, left: boolean) => ({
    position: "absolute" as const,
    top: top ? 0 : undefined,
    bottom: !top ? 0 : undefined,
    left: left ? 0 : undefined,
    right: !left ? 0 : undefined,
    width: size,
    height: size,
    borderColor: color,
    borderTopWidth: top ? thickness : 0,
    borderBottomWidth: !top ? thickness : 0,
    borderLeftWidth: left ? thickness : 0,
    borderRightWidth: !left ? thickness : 0,
    borderTopLeftRadius: top && left ? 6 : 0,
    borderTopRightRadius: top && !left ? 6 : 0,
    borderBottomLeftRadius: !top && left ? 6 : 0,
    borderBottomRightRadius: !top && !left ? 6 : 0,
  });
  return (
    <>
      <View style={s(true, true)} />
      <View style={s(true, false)} />
      <View style={s(false, true)} />
      <View style={s(false, false)} />
    </>
  );
}

// Resize image to max 800px wide at 60% quality before converting to base64
// This brings base64 from ~2MB down to ~150KB which the Edge Function can handle
const toBase64 = async (uri: string): Promise<string> => {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
  );
  const response = await fetch(manipulated.uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
};

export default function ScanReceiptCameraScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>("back");
  const [torchOn, setTorchOn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const captureAnim = useRef(new Animated.Value(1)).current;

  const animateCapture = () => {
    Animated.sequence([
      Animated.timing(captureAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(captureAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const uploadAndProceed = async (uri: string, fileName: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const storagePath = `${user.id}/receipts/${fileName}`;

      // Upload full-quality image to Supabase storage
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { supabase } = await import("@/lib/supabase");
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(storagePath, uint8Array, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw new Error(uploadError.message);

      // Private bucket — use a signed URL (valid for 1 hour) instead of getPublicUrl
      const { data: signedData, error: signedError } = await supabase.storage
        .from("receipts")
        .createSignedUrl(storagePath, 3600);

      if (signedError) throw new Error(signedError.message);
      const receiptUrl = signedData.signedUrl;

      // Insert receipt record
      await supabase.from("receipts").insert({
        user_id: user.id,
        storage_path: storagePath,
        file_name: fileName,
        ocr_status: "pending",
      });

      // Resize image and convert to base64 for OCR
      const base64 = await toBase64(uri);
      console.log("Base64 length after resize:", base64?.length ?? 0);

      // Pass signed URL and storage path to receipt review screen
      receiptState.set(base64, receiptUrl, storagePath);

      router.push("/scan-receipt-processing" as any);
    } catch (e: any) {
      console.error("Upload error:", e.message);
      Alert.alert(
        "Upload failed",
        "Could not upload receipt. You can still add the expense manually.",
        [
          { text: "Add Manually", onPress: () => router.push("/(tabs)/add-expense" as any) },
          { text: "Try Again", style: "cancel" },
        ]
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || uploading) return;
    animateCapture();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        await uploadAndProceed(photo.uri, `receipt_${Date.now()}.jpg`);
      }
    } catch (e) {
      console.error("Capture error:", e);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndProceed(result.assets[0].uri, `receipt_${Date.now()}.jpg`);
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#000" }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 12, textAlign: "center" }}>
          Camera Access Required
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", marginBottom: 32 }}>
          MyExpense needs camera access to scan receipts for ITR12 compliance.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} enableTorch={torchOn}>

        {/* Top bar */}
        <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Text style={{ color: "#fff", fontSize: 20 }}>✕</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, color: "#fff", fontSize: 17, fontWeight: "700" }}>Scan Receipt</Text>
          <TouchableOpacity
            onPress={() => setTorchOn((v) => !v)}
            style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: torchOn ? C.teal : "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginRight: 10 }}
          >
            <Text style={{ fontSize: 18 }}>🔦</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGallery}
            style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 18 }}>🖼️</Text>
          </TouchableOpacity>
        </View>

        {/* Viewfinder */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)" }} />
          <Animated.View style={{ width: 280, height: 240, transform: [{ scale: captureAnim }] }}>
            <CornerBrackets color={C.teal} size={28} thickness={3} />
          </Animated.View>
          <View style={{ marginTop: 24, paddingHorizontal: 40, alignItems: "center" }}>
            {uploading ? (
              <View style={{ alignItems: "center" }}>
                <ActivityIndicator color={C.teal} size="large" />
                <Text style={{ color: C.teal, fontSize: 14, fontWeight: "700", marginTop: 8 }}>
                  Uploading receipt…
                </Text>
              </View>
            ) : (
              <>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" }}>
                  Position receipt inside the frame
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 6, textAlign: "center" }}>
                  Ensure good lighting for best results
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Bottom controls */}
        <View style={{ paddingBottom: 40, paddingHorizontal: 40, paddingTop: 20, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/add-expense" as any)} style={{ alignItems: "center" }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 20 }}>✏️</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>Manual</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCapture} disabled={uploading} style={{ alignItems: "center" }}>
              <View style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: uploading ? C.teal : "#fff", alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: uploading ? "transparent" : "#fff", alignItems: "center", justifyContent: "center" }}>
                  {uploading && <ActivityIndicator color={C.teal} />}
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGallery} disabled={uploading} style={{ alignItems: "center" }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 20 }}>🖼️</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>Gallery</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
            🔒 Receipt stored securely in your private Supabase vault
          </Text>
        </View>

      </CameraView>
    </View>
  );
}
