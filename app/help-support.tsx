import { MXBackHeader } from "@/components/MXBackHeader";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@myexpense.co.za";
const DOCS_URL = "https://myexpense.co.za/help";

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "How do I scan a receipt?",
    a: "Tap the Scan tab at the bottom of the screen, then point your camera at a receipt. MyExpense will automatically extract the amount, date and vendor. You can review and edit before saving.",
  },
  {
    q: "What is the ITR12 export?",
    a: "The ITR12 export generates a PDF and CSV summary of your deductible expenses categorised under SARS Schedule 1 headings (S11(a), S11(e), etc.) which you can attach to your tax return submission on eFiling.",
  },
  {
    q: "How do I categorise an expense for tax?",
    a: "When adding or editing an expense, tap the Category field and choose the relevant SARS category. MyExpense will flag it as deductible and include it in your ITR12 export.",
  },
  {
    q: "What is the difference between Free and Pro?",
    a: "Free plan allows up to 10 receipt scans per month with basic categories. Pro gives you unlimited scans, full ITR12 categorisation, automated deduction optimisation, PDF/CSV exports and multi-device sync.",
  },
  {
    q: "How do I track mileage?",
    a: "Go to the Reports tab and tap Mileage Tracker. Start a trip and MyExpense will record your route. You can also add trips manually. SARS mileage is calculated at the prescribed rate.",
  },
  {
    q: "Is my data safe and POPIA compliant?",
    a: "Yes. All data is stored encrypted in South Africa on Supabase infrastructure. We comply with the Protection of Personal Information Act (POPIA). See our Privacy Policy for full details.",
  },
  {
    q: "How do I restore my subscription on a new device?",
    a: "Go to Settings → Subscription and tap Restore Purchases. Sign in with the same account used when you originally subscribed.",
  },
];

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        ...typography.captionM,
        color: colour.textSub,
        letterSpacing: 0.8,
        paddingHorizontal: space.lg,
        paddingTop: space.lg,
        paddingBottom: space.sm,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  );
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({
  question,
  answer,
  isLast,
}: {
  question: string;
  answer: string;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.7}
      style={{
        backgroundColor: colour.bgCard,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colour.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
        }}
      >
        <Text
          style={{
            ...typography.labelM,
            color: colour.text,
            flex: 1,
            marginRight: space.sm,
          }}
        >
          {question}
        </Text>
        <Text
          style={{ color: colour.textSub, fontSize: 18, fontWeight: "600" }}
        >
          {open ? "−" : "+"}
        </Text>
      </View>
      {open ? (
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingBottom: space.md,
            backgroundColor: colour.surface1,
          }}
        >
          <Text
            style={{
              ...typography.bodyS,
              color: colour.textSub,
              lineHeight: 22,
            }}
          >
            {answer}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Contact row ──────────────────────────────────────────────────────────────
function ContactRow({
  icon,
  label,
  sub,
  onPress,
  isLast = false,
}: {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colour.border,
        backgroundColor: colour.bgCard,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          backgroundColor: colour.primary50,
          alignItems: "center",
          justifyContent: "center",
          marginRight: space.md,
        }}
      >
        <IconSymbol name={icon as any} size={20} color={colour.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.labelM, color: colour.text }}>
          {label}
        </Text>
        <Text
          style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}
        >
          {sub}
        </Text>
      </View>
      <Text style={{ color: colour.textSub, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HelpSupportScreen() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=MyExpense Support Request`,
    ).catch(() =>
      Alert.alert(
        "Could not open email",
        `Please email us at ${SUPPORT_EMAIL}`,
      ),
    );
  };

  const handleDocs = () => {
    Linking.openURL(DOCS_URL).catch(() =>
      Alert.alert("Could not open link", `Visit ${DOCS_URL}`),
    );
  };

  const handlePrivacy = () => router.push("/privacy");
  const handleTerms = () => router.push("/terms");

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXBackHeader title="Help & Support" />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact us */}
        <SectionHeader title="Contact us" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <ContactRow
            icon="envelope.fill"
            label="Email support"
            sub={SUPPORT_EMAIL}
            onPress={handleEmail}
          />
          <ContactRow
            icon="globe"
            label="Help centre"
            sub="Browse guides and tutorials online"
            onPress={handleDocs}
            isLast
          />
        </View>

        {/* FAQs */}
        <SectionHeader title="Frequently asked questions" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          {FAQS.map((faq, i) => (
            <FaqItem
              key={i}
              question={faq.q}
              answer={faq.a}
              isLast={i === FAQS.length - 1}
            />
          ))}
        </View>

        {/* Legal */}
        <SectionHeader title="Legal" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <ContactRow
            icon="shield.fill"
            label="Privacy policy"
            sub="How we handle your data"
            onPress={handlePrivacy}
          />
          <ContactRow
            icon="doc.text.fill"
            label="Terms of service"
            sub="App terms & conditions"
            onPress={handleTerms}
            isLast
          />
        </View>

        {/* App version */}
        <View
          style={{
            alignItems: "center",
            marginTop: space.xl,
            paddingHorizontal: space.lg,
          }}
        >
          <Text style={{ ...typography.bodyXS, color: colour.textHint }}>
            MyExpense · Version 1.0.0
          </Text>
          <Text
            style={{
              ...typography.bodyXS,
              color: colour.textHint,
              marginTop: 4,
            }}
          >
            POPIA compliant · South African data residency
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
