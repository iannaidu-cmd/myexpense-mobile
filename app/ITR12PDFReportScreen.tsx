import { NavigationProp } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  navigation?: NavigationProp<any>;
}


const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation?: NavigationProp<any>;
}) {
  const tabs = [
    { key: "Home", label: "Home", icon: NAV.Home },
    { key: "Scan", label: "Scan", icon: NAV.Scan },
    { key: "Reports", label: "Reports", icon: NAV.Reports },
    { key: "Settings", label: "Settings", icon: NAV.Settings },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 8,
          paddingTop: 6,
        }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => navigation?.navigate(t.key)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text style={{ fontSize: 20, color: C.textSub }}>{t.icon}</Text>
            <Text style={{ fontSize: 10, marginTop: 2, color: C.textSub }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ITR12PDFReportScreen({ navigation }: Props) {
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
    { title: "Cover Page", pages: 1, done: true },
    { title: "Taxpayer Information", pages: 1, done: true },
    { title: "Income Statement", pages: 2, done: true },
    { title: "Deduction Schedule", pages: 3, done: true },
    { title: "Category Breakdown", pages: 4, done: !generating },
    { title: "Receipt Register", pages: 12, done: !generating },
    { title: "VAT Summary", pages: 2, done: false },
    { title: "Supporting Documentation", pages: 8, done: false },
  ];

  return (
    <PhoneShell navigation={navigation}>
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 52,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
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

      <View
        style={{
          backgroundColor: C.bgLighter,
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
          {/* PDF header */}
          <View
            style={{
              backgroundColor: C.danger,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 10 }}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.white, fontSize: 14, fontWeight: "700" }}>
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

          {/* PDF page mock */}
          <View style={{ padding: 16 }}>
            <View
              style={{
                backgroundColor: C.bgLighter,
                borderRadius: 8,
                padding: 16,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              {/* Mock page content */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text
                    style={{ fontSize: 16, fontWeight: "900", color: C.navy }}
                  >
                    MyExpense
                  </Text>
                  <Text style={{ fontSize: 10, color: C.textSub }}>
                    SARS ITR12 Deduction Report
                  </Text>
                </View>
                <Text style={{ fontSize: 22 }}>🇿🇦</Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: C.border,
                  marginBottom: 10,
                }}
              />
              {[
                { label: "Taxpayer", value: "Ian Naidu" },
                { label: "Tax Number", value: "1234567890" },
                { label: "Period", value: "2024/25" },
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
                    style={{ fontSize: 11, fontWeight: "700", color: C.text }}
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
                style={{ fontSize: 10, color: C.textSub, textAlign: "center" }}
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
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>
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
            <View
              style={{
                height: 6,
                backgroundColor: C.bgLight,
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
                  backgroundColor: s.done ? C.success : C.bgLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {s.done ? (
                  <Text
                    style={{ color: C.white, fontSize: 11, fontWeight: "800" }}
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
              <Text style={{ fontSize: 11, color: C.textSub }}>{s.pages}p</Text>
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
              <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>
                Share PDF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                marginHorizontal: 16,
                borderWidth: 2,
                borderColor: C.navy,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: C.navy, fontSize: 15, fontWeight: "700" }}>
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
