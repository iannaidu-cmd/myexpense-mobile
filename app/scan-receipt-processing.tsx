import { receiptState } from "@/lib/receiptState";
import { colour } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";

const C = colour;

const STEPS = [
  {
    id: 1,
    label: "Uploading receipt",
    detail: "Storing securely in your vault",
    durationMs: 500,
  },
  {
    id: 2,
    label: "Reading receipt image",
    detail: "Claude AI analysing the photo",
    durationMs: 800,
  },
  {
    id: 3,
    label: "Extracting vendor & amount",
    detail: "Finding totals, date and supplier",
    durationMs: 1000,
  },
  {
    id: 4,
    label: "Matching ITR12 category",
    detail: "Mapping to SARS tax codes",
    durationMs: 800,
  },
  {
    id: 5,
    label: "Ready to review",
    detail: "Confirm the extracted details",
    durationMs: 400,
  },
];

interface ExtractedData {
  vendor?: string;
  amount?: string;
  date?: string;
  vatAmount?: string;
  category?: string;
  notes?: string;
}

async function extractReceiptData(base64: string): Promise<ExtractedData> {
  try {
    if (!base64 || base64.length < 100) {
      console.warn("OCR: base64 too short or empty, skipping");
      return {};
    }
    console.log("OCR: sending image, base64 length:", base64.length);

    const SUPABASE_URL = "https://hhfbbbxgmovfpaziebsw.supabase.co";
    const ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZmJiYnhnbW92ZnBhemllYnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODA2NTAsImV4cCI6MjA4NzE1NjY1MH0.Z2frUvYeIl7aJGsn4LG5Pm1UocBIKnx7ld80uiEGzRc";

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ocr-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ imageBase64: base64 }),
    });

    const data = await response.json();
    console.log("OCR result:", JSON.stringify(data).slice(0, 300));
    if (data.error) {
      console.error("OCR error from function:", data.error);
      return {};
    }
    return data ?? {};
  } catch (e) {
    console.error("OCR extraction error:", e);
    return {};
  }
}

export default function ScanReceiptProcessingScreen() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});

  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1.0,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    // Read from in-memory state — avoids URL param size limits for base64
    const base64 = receiptState.getBase64() ?? "";
    const receiptUrl = receiptState.getUrl() ?? "";
    const storagePath = receiptState.getPath() ?? "";

    let step = 0;
    let ocrResult: ExtractedData = {};

    const run = async () => {
      if (step >= STEPS.length) {
        setDone(true);
        Animated.timing(progress, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
        setTimeout(() => {
          receiptState.clear();
          const params = new URLSearchParams({
            receiptUrl,
            storagePath,
            vendor: ocrResult.vendor ?? "",
            amount: ocrResult.amount ?? "",
            date: ocrResult.date ?? "",
            vatAmount: ocrResult.vatAmount ?? "",
            category: ocrResult.category ?? "",
            notes: ocrResult.notes ?? "",
          });
          router.replace(`/receipt-review?${params.toString()}` as any);
        }, 900);
        return;
      }

      setCurrentStep(step);
      Animated.timing(progress, {
        toValue: (step + 1) / STEPS.length,
        duration: STEPS[step].durationMs * 0.8,
        useNativeDriver: false,
      }).start();

      // Run Claude OCR on step 2 — errors are caught and return {} so flow continues
      if (step === 2 && base64) {
        ocrResult = await extractReceiptData(base64);
        setExtractedData(ocrResult);
      }

      await new Promise((r) => setTimeout(r, STEPS[step].durationMs));
      step += 1;
      run();
    };

    run();
  }, []);

  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.primary }}>
      <View
        style={{
          paddingTop: 52,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            flex: 1,
            color: C.onPrimary,
            fontSize: 17,
            fontWeight: "700",
          }}
        >
          Processing Receipt
        </Text>
        {!done && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 10,
            }}
          >
            <Text
              style={{ color: C.onPrimary, fontSize: 12, fontWeight: "600" }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        {done ? (
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: C.success,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 48, color: "#fff" }}>✓</Text>
            </View>
            <Text
              style={{
                color: C.onPrimary,
                fontSize: 22,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              Receipt Ready!
            </Text>
            {extractedData.vendor ? (
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                Found: {extractedData.vendor}
                {extractedData.amount ? ` · R ${extractedData.amount}` : ""}
              </Text>
            ) : (
              <Text
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                Opening review screen…
              </Text>
            )}
          </View>
        ) : (
          <>
            <Animated.View
              style={{ transform: [{ scale: pulse }], marginBottom: 32 }}
            >
              <View
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <Animated.Text
                  style={{ fontSize: 48, transform: [{ rotate: spinDeg }] }}
                >
                  ⚙
                </Animated.Text>
              </View>
            </Animated.View>

            <Text
              style={{
                color: C.onPrimary,
                fontSize: 20,
                fontWeight: "800",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Analysing Receipt
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              Claude AI is reading your receipt and extracting expense details
            </Text>

            <View style={{ width: "100%", marginBottom: 32 }}>
              <View
                style={{
                  height: 6,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 3,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <Animated.View
                  style={{
                    height: 6,
                    backgroundColor: C.teal,
                    borderRadius: 3,
                    width: progressWidth,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                  Step {Math.min(currentStep + 1, STEPS.length)} of{" "}
                  {STEPS.length}
                </Text>
                <Text
                  style={{ color: C.teal, fontSize: 11, fontWeight: "700" }}
                >
                  {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
                </Text>
              </View>
            </View>

            <View
              style={{
                width: "100%",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {STEPS.map((step, i) => {
                const isActive = i === currentStep;
                const isComplete = i < currentStep;
                return (
                  <View
                    key={step.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: i < STEPS.length - 1 ? 1 : 0,
                      borderBottomColor: "rgba(255,255,255,0.06)",
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isComplete
                          ? C.success
                          : isActive
                            ? C.teal
                            : "rgba(255,255,255,0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      {isComplete ? (
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "800",
                          }}
                        >
                          ✓
                        </Text>
                      ) : isActive ? (
                        <Animated.Text
                          style={{
                            color: "#fff",
                            fontSize: 11,
                            transform: [{ rotate: spinDeg }],
                          }}
                        >
                          ↻
                        </Animated.Text>
                      ) : (
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: 11,
                          }}
                        >
                          {step.id}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? "700" : "500",
                          color: isComplete
                            ? "rgba(255,255,255,0.45)"
                            : isActive
                              ? "#fff"
                              : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {step.label}
                      </Text>
                      {isActive && (
                        <Text
                          style={{ fontSize: 11, color: C.teal, marginTop: 2 }}
                        >
                          {step.detail}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {!done && (
        <View style={{ paddingHorizontal: 32, paddingBottom: 40 }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
              textAlign: "center",
            }}
          >
            🔒 Powered by Claude AI · Receipt data stays private
          </Text>
        </View>
      )}
    </View>
  );
}
