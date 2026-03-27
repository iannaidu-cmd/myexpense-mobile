import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Linking, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
  { number: "1", title: "Download your ITR12 export",    icon: "📄", action: null,                                                          tip: "Keep the PDF — SARS may request supporting documents for up to 5 years.",                                            description: "Generate and save your MyExpense ITR12 PDF report. This contains all your deductions, supporting schedules and receipt register." },
  { number: "2", title: "Log into SARS eFiling",         icon: "🔐", action: { label: "Open SARS eFiling", url: "https://efiling.sars.gov.za" }, tip: "Use the SARS MobiApp as an alternative to the website.",                                                         description: "Visit the SARS eFiling portal and log in with your username and password. If you don't have an account, register at efiling.sars.gov.za." },
  { number: "3", title: "Navigate to Income Tax",        icon: "📂", action: null,                                                          tip: "Select the correct tax year — 2024/25 means 1 March 2024 to 28 February 2025.",                                         description: "From the eFiling dashboard, select Returns → Income Tax → ITR12. SARS will auto-populate some fields from employers and banks." },
  { number: "4", title: "Enter your deductions",         icon: "✏️", action: null,                                                          tip: "Your MyExpense export shows ITR12 line codes per category — match them exactly.",                                        description: "Use the amounts from your MyExpense ITR12 export to complete Section 11 (Other Deductions). Enter each category against its ITR12 code." },
  { number: "5", title: "Upload supporting documents",   icon: "📎", action: null,                                                          tip: "SARS accepts PDF, JPG and PNG. Max 5MB per document.",                                                                  description: "Attach your MyExpense PDF report and receipt register as supporting documents in the eFiling document manager." },
  { number: "6", title: "Review and submit",             icon: "✅", action: null,                                                          tip: "Save a copy of your submission acknowledgement number.",                                                                description: "Review your return carefully before submission. Once submitted, SARS will issue an assessment. You can request a correction if needed." },
];

const KEY_DATES = [
  { label: "Tax year end",           date: "28 Feb 2025",  past: true  },
  { label: "eFiling opens",          date: "1 Jul 2025",   past: false },
  { label: "Non-provisional filing", date: "21 Oct 2025",  past: false },
  { label: "Provisional (auto)",     date: "20 Jan 2026",  past: false },
];

export default function ITR12EFilingGuideScreen() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (num: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  };

  const progress = (completedSteps.size / STEPS.length) * 100;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Custom header with progress bar */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space["4xl"] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
            <Text style={{ ...typography.labelM, color: "rgba(255,255,255,0.85)", marginLeft: 4 }}>Export Preview</Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ ...typography.h3, color: colour.onPrimary }}>eFiling Guide</Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Step-by-step ITR12 submission · SARS 2024/25</Text>
        <View style={{ marginTop: space.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: space.xs }}>
            <Text style={{ ...typography.labelS, color: colour.onPrimary }}>{completedSteps.size} of {STEPS.length} steps completed</Text>
            <Text style={{ ...typography.labelS, color: colour.primary100 }}>{Math.round(progress)}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3 }}>
            <View style={{ width: `${progress}%`, height: 6, backgroundColor: colour.onPrimary, borderRadius: 3 }} />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: colour.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ marginHorizontal: space.md, marginTop: space.lg, backgroundColor: colour.primary, borderRadius: radius.md, padding: space.md, marginBottom: space.lg }}>
          <Text style={{ color: colour.onPrimary, fontSize: 13, fontWeight: "700", marginBottom: 12 }}>📅 SARS Key Dates — 2024/25</Text>
          {KEY_DATES.map((d, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.past ? colour.successMid : colour.accent, marginRight: 10 }} />
              <Text style={{ flex: 1, fontSize: 12, color: d.past ? colour.primary200 : colour.onPrimary }}>{d.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: d.past ? colour.primary200 : colour.primary100 }}>{d.date}</Text>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: space.md }}>
          <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.md }}>SUBMISSION STEPS</Text>
          {STEPS.map((step, i) => {
            const isComplete = completedSteps.has(step.number);
            return (
              <View key={i} style={{ marginBottom: space.md }}>
                <TouchableOpacity onPress={() => toggleStep(step.number)} style={{ backgroundColor: colour.white, borderRadius: radius.md, padding: space.md, borderWidth: 1.5, borderColor: isComplete ? colour.success : colour.borderLight }} activeOpacity={0.8}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isComplete ? colour.success : colour.primary, alignItems: "center", justifyContent: "center", marginRight: space.md, marginTop: 2 }}>
                      <Text style={{ color: colour.onPrimary, fontSize: 16, fontWeight: "800" }}>{isComplete ? "✓" : step.number}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: space.xs }}>
                        <Text style={{ fontSize: 20, marginRight: space.xs }}>{step.icon}</Text>
                        <Text style={{ ...typography.labelM, color: isComplete ? colour.success : colour.textPrimary, flex: 1 }}>{step.title}</Text>
                      </View>
                      <Text style={{ ...typography.bodyS, color: colour.textSecondary, lineHeight: 20 }}>{step.description}</Text>
                      <View style={{ backgroundColor: colour.infoLight, borderRadius: radius.sm, padding: space.sm, marginTop: space.sm }}>
                        <Text style={{ ...typography.bodyXS, color: colour.info }}>💡 {step.tip}</Text>
                      </View>
                      {step.action && (
                        <TouchableOpacity onPress={() => Linking.openURL(step.action!.url)} style={{ marginTop: space.sm, backgroundColor: colour.primary, borderRadius: radius.sm, paddingVertical: space.sm, paddingHorizontal: space.md, alignSelf: "flex-start" }}>
                          <Text style={{ color: colour.onPrimary, fontSize: 13, fontWeight: "700" }}>{step.action.label} →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={{ ...typography.micro, color: isComplete ? colour.success : colour.textHint, textAlign: "right", marginTop: space.xs }}>{isComplete ? "✓ Marked complete" : "Tap to mark complete"}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={{ marginHorizontal: space.md, backgroundColor: colour.warningBg, borderRadius: radius.md, padding: space.md, marginBottom: space.md }}>
          <Text style={{ ...typography.labelM, color: colour.warning, marginBottom: space.xs }}>⚠️ Professional Review Recommended</Text>
          <Text style={{ ...typography.bodyS, color: colour.warning, lineHeight: 20 }}>While MyExpense automates expense tracking and categorisation, we recommend having your ITR12 reviewed by a registered SARS tax practitioner before submission.</Text>
        </View>

        <View style={{ marginHorizontal: space.md, backgroundColor: colour.primaryLight, borderRadius: radius.md, padding: space.md, marginBottom: space.md }}>
          <Text style={{ ...typography.labelM, color: colour.primary, marginBottom: space.xs }}>🚀 Coming in Phase 2</Text>
          <Text style={{ ...typography.bodyS, color: colour.primary, lineHeight: 20 }}>Direct eFiling submission on your behalf — MyExpense is applying for SARS ISV registration. Once approved, you'll be able to submit your ITR12 directly from the app with one tap.</Text>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={{ marginHorizontal: space.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colour.border, padding: 14, alignItems: "center" }}>
          <Text style={{ color: colour.textSecondary, fontSize: 14, fontWeight: "600" }}>← Back to Preview</Text>
        </TouchableOpacity>
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
