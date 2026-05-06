import { IconSymbol } from "@/components/ui/icon-symbol";
import { CATEGORIES } from "@/constants/categories";
import { receiptState } from "@/lib/receiptState";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Fuzzy-match OCR category string against the canonical CATEGORIES list.
// Tries exact → case-insensitive → partial containment.
function normalizeCategoryName(raw: string | undefined, labels: string[]): string {
  if (!raw) return "";
  const exact = labels.find((l) => l === raw);
  if (exact) return exact;
  const lower = raw.toLowerCase();
  const ci = labels.find((l) => l.toLowerCase() === lower);
  if (ci) return ci;
  const partial = labels.find(
    (l) => l.toLowerCase().includes(lower) || lower.includes(l.toLowerCase()),
  );
  return partial ?? "";
}

const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

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
    detail: "Analysing the photo — retrying if busy",
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
  if (!base64 || base64.length < 100) return {};

  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
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

      if (data.error) {
        const isOverloaded =
          response.status === 529 ||
          data.error?.type === "overloaded_error" ||
          (typeof data.error === "string" && data.error.includes("overloaded_error"));

        if (isOverloaded && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
          continue;
        }
        return {};
      }

      return data ?? {};
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return {};
    }
  }
  return {};
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
            category: normalizeCategoryName(ocrResult.category, CATEGORY_LABELS),
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
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>

      {/* Header */}
      <View style={{
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
      }}>
        <Text style={{ flex: 1, ...typography.h4, color: colour.text }}>
          Processing Receipt
        </Text>
        {!done && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
              backgroundColor: colour.surface1,
              borderRadius: radius.pill,
            }}
          >
            <Text style={{ ...typography.labelS, color: colour.textSub }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: space.xxxl,
      }}>
        {done ? (
          <View style={{ alignItems: "center" }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colour.successBg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space.xxl,
            }}>
              <IconSymbol name="checkmark" size={40} color={colour.success} />
            </View>
            <Text style={{ ...typography.h2, color: colour.text, marginBottom: space.sm, textAlign: "center" }}>
              Receipt Ready!
            </Text>
            {extractedData.vendor ? (
              <Text style={{ ...typography.bodyM, color: colour.textSub, textAlign: "center" }}>
                {extractedData.vendor}
                {extractedData.amount ? ` · R ${extractedData.amount}` : ""}
              </Text>
            ) : (
              <Text style={{ ...typography.bodyM, color: colour.textSub, textAlign: "center" }}>
                Opening review screen…
              </Text>
            )}
          </View>
        ) : (
          <>
            {/* Pulsing icon */}
            <Animated.View style={{ transform: [{ scale: pulse }], marginBottom: space.xxl }}>
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: colour.primary50,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colour.primary100,
              }}>
                <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
                  <IconSymbol name="gearshape" size={44} color={colour.primary} />
                </Animated.View>
              </View>
            </Animated.View>

            <Text style={{ ...typography.h3, color: colour.text, marginBottom: space.sm, textAlign: "center" }}>
              Analysing Receipt
            </Text>
            <Text style={{ ...typography.bodyM, color: colour.textSub, textAlign: "center", marginBottom: space.xxl }}>
              Reading your receipt and extracting expense details
            </Text>

            {/* Progress bar */}
            <View style={{ width: "100%", marginBottom: space.xxl }}>
              <View style={{
                height: 6,
                backgroundColor: colour.borderLight,
                borderRadius: radius.pill,
                overflow: "hidden",
                marginBottom: space.sm,
              }}>
                <Animated.View style={{
                  height: 6,
                  backgroundColor: colour.primary,
                  borderRadius: radius.pill,
                  width: progressWidth,
                }} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...typography.micro, color: colour.textSub }}>
                  Step {Math.min(currentStep + 1, STEPS.length)} of {STEPS.length}
                </Text>
                <Text style={{ ...typography.micro, color: colour.primary, fontWeight: "700" }}>
                  {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
                </Text>
              </View>
            </View>

            {/* Steps list */}
            <View style={{
              width: "100%",
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colour.borderLight,
              overflow: "hidden",
            }}>
              {STEPS.map((step, i) => {
                const isActive = i === currentStep;
                const isComplete = i < currentStep;
                return (
                  <View
                    key={step.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: space.lg,
                      paddingVertical: space.md,
                      borderBottomWidth: i < STEPS.length - 1 ? 1 : 0,
                      borderBottomColor: colour.borderLight,
                      backgroundColor: isActive ? colour.primary50 : colour.white,
                    }}
                  >
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: isComplete
                        ? colour.success
                        : isActive
                          ? colour.primary
                          : colour.surface1,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: space.md,
                    }}>
                      {isComplete ? (
                        <IconSymbol name="checkmark" size={12} color={colour.white} />
                      ) : isActive ? (
                        <ActivityIndicator size="small" color={colour.white} />
                      ) : (
                        <Text style={{ ...typography.micro, color: colour.textSub }}>
                          {step.id}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        ...typography.labelM,
                        color: isComplete
                          ? colour.textSub
                          : isActive
                            ? colour.text
                            : colour.textHint,
                      }}>
                        {step.label}
                      </Text>
                      {isActive && (
                        <Text style={{ ...typography.micro, color: colour.primary, marginTop: 2 }}>
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

      {/* Footer */}
      {!done && (
        <View style={{ paddingHorizontal: space.xxxl, paddingBottom: space["4xl"] }}>
          <Text style={{ ...typography.micro, color: colour.textHint, textAlign: "center" }}>
            Your receipt data is stored privately and securely
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
