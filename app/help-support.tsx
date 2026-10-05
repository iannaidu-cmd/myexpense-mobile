import { MXHeader } from "@/components/MXHeader";
import { NoteCard, SectionEyebrow } from "@/components/MXSection";
import { MXTabBar } from "@/components/MXTabBar";
import { showNotice } from "@/components/NoticeHost";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  FREE_EXPENSE_LIMIT,
  FREE_ITR12_EXPORT_LIMIT,
  FREE_MILEAGE_TRIP_LIMIT,
  FREE_SCAN_LIMIT,
} from "@/constants/freeTier";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import * as Application from "expo-application";
import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@myexpense.co.za";

type Faq = { q: string; a: string; link?: { label: string; route: Href } };

// ─── FAQ data ─────────────────────────────────────────────────────────────────
// Directions match the real tab bar (Home · Track · + · Reports · Me), and each
// answer that sends the user somewhere carries a link straight there.
function buildFaqs(isPremium: boolean): Faq[] {
  const subscriptionRoute: Href = isPremium ? "/subscription-manage" : "/paywall-upgrade";
  return [
    {
      q: "How do I scan a receipt?",
      a: "Tap the + button at the bottom of the screen, then Scan receipt, and point your camera at the slip. MyExpense reads the amount, date and shop for you. You can check and change anything before you save.",
      link: { label: "Scan a receipt", route: "/scan-receipt-camera" },
    },
    {
      q: "What is the ITR12 export?",
      a: "It is a PDF and CSV summary of the expenses you can claim, grouped the way SARS asks for them. Use it to fill in your tax return on eFiling, or send it to your accountant. Find it under Reports, then Export ITR12.",
      link: { label: "Open the ITR12 export", route: "/itr12-export-setup" },
    },
    {
      q: "How do I sort an expense for tax?",
      a: "When you add or edit an expense, tap Category and pick the one that fits. MyExpense then counts it towards what you can claim and adds it to your ITR12 export. Not sure what counts? The deductibility guide explains it.",
      link: { label: "Open the deductibility guide", route: "/deductibility-guide" },
    },
    {
      q: "What is the difference between Free and Pro?",
      a: `The Free plan includes ${FREE_SCAN_LIMIT} receipt scans, ${FREE_EXPENSE_LIMIT} manual expenses, ${FREE_MILEAGE_TRIP_LIMIT} mileage trips and ${FREE_ITR12_EXPORT_LIMIT} tax report exports every calendar month. Pro removes these monthly limits, so you can scan, log and export as much as you need.`,
      link: { label: isPremium ? "Manage your subscription" : "See Pro", route: subscriptionRoute },
    },
    {
      q: "How do I track mileage?",
      a: "Tap Track at the bottom of the screen. Add your vehicle, then start a trip. MyExpense records how far you drove, where you went and why. You can also add a trip you didn't track. Add the km on your dashboard at the start and end of the tax year too. Your logbook then shows how much of your driving was for work, and you claim that share of your vehicle costs (fuel, insurance, repairs, licence and finance charges).",
      link: { label: "Open mileage tracking", route: "/mileage-tracker" },
    },
    {
      q: "Is my data safe and POPIA compliant?",
      a: "Yes. Your data is encrypted when it is sent and when it is stored. It is kept on secure Supabase servers in Ireland, in the European Union, which has data protection laws as strong as POPIA. We never sell your data. Our privacy policy has the full details.",
      link: { label: "Read the privacy policy", route: "/privacy" },
    },
    {
      q: "How do I restore my subscription on a new device?",
      a: "Sign in with the same account you used when you subscribed. Then tap Me, then Subscription, and tap Restore purchase.",
      link: { label: "Go to Subscription", route: subscriptionRoute },
    },
  ];
}

// ─── Card wrapper (white list card, as on Vehicles / Mileage history) ─────────
function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colour.bgCard,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colour.border,
        overflow: "hidden",
        marginBottom: space.xl,
      }}
    >
      {children}
    </View>
  );
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ faq, isLast }: { faq: Faq; isLast: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colour.borderLight,
      }}
    >
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          gap: space.sm,
        }}
      >
        <Text style={{ ...typography.itemTitle, color: colour.text, flex: 1 }}>{faq.q}</Text>
        <IconSymbol
          name={open ? "chevron.up" : "chevron.down"}
          size={16}
          color={colour.textSub}
        />
      </TouchableOpacity>
      {open ? (
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm }}>
          <Text style={{ ...typography.mSub, color: colour.textSub, lineHeight: 19 }}>{faq.a}</Text>
          {faq.link ? (
            <TouchableOpacity
              onPress={() => router.push(faq.link!.route)}
              activeOpacity={0.7}
              accessibilityRole="link"
              style={{
                alignSelf: "flex-start",
                backgroundColor: colour.primary50,
                borderRadius: radius.pill,
                paddingHorizontal: space.md,
                paddingVertical: space.xs,
              }}
            >
              <Text style={{ ...typography.chipText, color: colour.accentDeep }}>
                {faq.link.label} ›
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ─── Link row ─────────────────────────────────────────────────────────────────
function LinkRow({
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
      accessibilityRole="link"
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colour.borderLight,
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
        <Text style={{ ...typography.itemTitle, color: colour.text }}>{label}</Text>
        <Text style={{ ...typography.itemSub, color: colour.textSub, marginTop: 3 }}>{sub}</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colour.textSub} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HelpSupportScreen() {
  const router = useRouter();
  const isPremium = useAuthStore((s) => s.isPremium);
  const faqs = buildFaqs(isPremium);
  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;

  const handleEmail = () => {
    const subject = encodeURIComponent("MyExpense support request");
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() =>
      showNotice({
        title: "We couldn't open your email app",
        message: `Please email us at ${SUPPORT_EMAIL}`,
        tone: "info",
        icon: "envelope.fill",
      }),
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader title="Help & support" subtitle="Answers and ways to reach us" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact us */}
        <SectionEyebrow>Contact us</SectionEyebrow>
        <ListCard>
          <LinkRow
            icon="envelope.fill"
            label="Email support"
            sub={SUPPORT_EMAIL}
            onPress={handleEmail}
            isLast
          />
        </ListCard>

        {/* FAQs */}
        <SectionEyebrow>Common questions</SectionEyebrow>
        <ListCard>
          {faqs.map((faq, i) => (
            <FaqItem key={faq.q} faq={faq} isLast={i === faqs.length - 1} />
          ))}
        </ListCard>

        {/* Legal */}
        <SectionEyebrow>Legal</SectionEyebrow>
        <ListCard>
          <LinkRow
            icon="shield.fill"
            label="Privacy policy"
            sub="How we handle your data"
            onPress={() => router.push("/privacy")}
          />
          <LinkRow
            icon="doc.text.fill"
            label="Terms of service"
            sub="App terms and conditions"
            onPress={() => router.push("/terms")}
            isLast
          />
        </ListCard>

        <NoteCard
          icon="lock.shield.fill"
          title="Your data is protected"
          body="We follow POPIA, encrypt your data and never sell it."
        />

        {/* App version */}
        <Text
          style={{
            ...typography.hintText,
            color: colour.textHint,
            textAlign: "center",
            marginTop: space.sm,
          }}
        >
          MyExpense{version ? ` · Version ${version}${build ? ` (${build})` : ""}` : ""}
        </Text>
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
