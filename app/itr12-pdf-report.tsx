import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Alias for brevity — every value is now a live token from @/tokens/colours.ts
const C = colour;

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <MXTabBar />
    </View>
  );
}

export default function ITR12PDFReportScreen() {
  const router = useRouter();
  const [generating, setGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setGenerating(false));

    const iv = setInterval(
      () =>
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(iv);
            return 100;
          }
          return p + 3;
        }),
      72,
    );
    return () => clearInterval(iv);
  }, []);

  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const barW = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const PDF_SECTIONS = [
    { title: "Cover page",               pages: 1,  done: true         },
    { title: "Taxpayer information",      pages: 1,  done: true         },
    { title: "Income statement",          pages: 2,  done: true         },
    { title: "Deduction schedule",        pages: 3,  done: true         },
    { title: "Category breakdown",        pages: 4,  done: !generating  },
    { title: "Receipt register",          pages: 12, done: !generating  },
    { title: "VAT summary",              pages: 2,  done: false        },
    { title: "Supporting documentation", pages: 8,  done: false        },
  ];

  return (
    <PhoneShell>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.primary,
          paddingTop: 52,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 10 }}
        >
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Preview</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: C.teal,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          TAX & ITR12
        </Text>
        <Text
          style={{
            color: C.white,
            fontSize: 22,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          PDF Report
        </Text>
        <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>
          Tax Year 2024/25
        </Text>
      </View>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          paddingBottom: 30,
        }}
      >
        {/* PDF preview card */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            marginBottom: 16,
            backgroundColor: C.white,
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          {/* PDF header strip */}
          <View
            style={{
              backgroundColor: C.danger,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <IconSymbol name="doc.text.fill" size={24} color={colour.white} style={{ marginRight: 10 } as any} />
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: C.white, fontSize: 14, fontWeight: "700" }}
              >
                MyExpense_ITR12_2024-25.pdf
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {generating
                  ? `Generating… ${progress}%`
                  : "33 pages · 2.4 MB · Ready"}
              </Text>
            </View>
          </View>

          {/* Mock page preview */}
          <View style={{ padding: 16 }}>
            <View
              style={{
                backgroundColor: C.surface1,
                borderRadius: 8,
                padding: 16,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "900",
                      color: C.primary,
                    }}
                  >
                    MyExpense
                  </Text>
                  <Text style={{ fontSize: 10, color: C.textSub }}>
                    SARS ITR12 Deduction Report
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colour.textSub }}>ZA</Text>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: C.border,
                  marginBottom: 10,
                }}
              />

              {[
                { label: "Taxpayer",    value: "Ian Naidu"   },
                { label: "Tax Number",  value: "1234567890" },
                { label: "Period",      value: "2024/25"    },
                { label: "Total Deduct.", value: "R 95,680" },
              ].map((r, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ fontSize: 11, color: C.textSub }}>
                    {r.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: C.text,
                    }}
                  >
                    {r.value}
                  </Text>
                </View>
              ))}

              <View
                style={{
                  height: 1,
                  backgroundColor: C.border,
                  marginVertical: 10,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: C.textSub,
                  textAlign: "center",
                }}
              >
                Page 1 of 33
              </Text>
            </View>
          </View>
        </View>

        {/* Generation progress */}
        {generating && (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: C.white,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: C.border,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Animated.Text
                style={{
                  fontSize: 20,
                  marginRight: 10,
                  transform: [{ rotate: spinDeg }],
                }}
              >
                ⚙
              </Animated.Text>
              <Text
                style={{ fontSize: 13, fontWeight: "700", color: C.text }}
              >
                Generating PDF…
              </Text>
              <Text
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  fontWeight: "700",
                  color: C.teal,
                }}
              >
                {progress}%
              </Text>
            </View>

            {/* Progress track */}
            <View
              style={{
                height: 6,
                backgroundColor: C.surface2,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  height: 6,
                  backgroundColor: C.teal,
                  borderRadius: 3,
                  width: barW,
                }}
              />
            </View>
          </View>
        )}

        {/* Section checklist */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: C.white,
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              padding: 14,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>
              Report Sections
            </Text>
          </View>

          {PDF_SECTIONS.map((s, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 11,
                borderBottomWidth: i < PDF_SECTIONS.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: s.done ? C.success : C.surface2,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {s.done ? (
                  <Text
                    style={{
                      color: C.white,
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                  >
                    ✓
                  </Text>
                ) : (
                  <Text style={{ color: C.textSub, fontSize: 10 }}>…</Text>
                )}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: s.done ? C.text : C.textSub,
                }}
              >
                {s.title}
              </Text>
              <Text style={{ fontSize: 11, color: C.textSub }}>
                {s.pages}p
              </Text>
            </View>
          ))}
        </View>

        {/* Share actions */}
        {!generating && (
          <>
            <TouchableOpacity
              style={{
                marginHorizontal: 16,
                backgroundColor: C.teal,
                borderRadius: 14,
                padding: 16,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{ color: C.white, fontSize: 15, fontWeight: "700" }}
              >
                Share PDF
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                marginHorizontal: 16,
                borderWidth: 2,
                borderColor: C.primary,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{ color: C.primary, fontSize: 15, fontWeight: "700" }}
              >
                Save to Files
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                marginHorizontal: 16,
                borderWidth: 2,
                borderColor: C.border,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ color: C.textSub, fontSize: 15, fontWeight: "700" }}
              >
                Email to Accountant
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Disclaimer */}
        <View style={{ marginHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 11,
              color: C.textSub,
              textAlign: "center",
              lineHeight: 16,
            }}
          >
            ⚠ This report is for record-keeping purposes. Have it reviewed by a
            registered SARS tax practitioner before submission.
          </Text>
        </View>
      </View>
    </PhoneShell>
  );
}
