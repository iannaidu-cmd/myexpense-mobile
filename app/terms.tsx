import { MXHeader } from "@/components/MXHeader";
import { colour, radius, space } from "@/tokens";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LAST_UPDATED = "1 March 2025";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={{ marginBottom: space.xl }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: colour.text,
          marginBottom: space.sm,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 14, color: colour.textSub, lineHeight: 22 }}>
      {children}
    </Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{ flexDirection: "row", gap: space.sm, marginBottom: space.xs }}
    >
      <Text style={{ fontSize: 14, color: colour.textSub, lineHeight: 22 }}>
        •
      </Text>
      <Text
        style={{ flex: 1, fontSize: 14, color: colour.textSub, lineHeight: 22 }}
      >
        {children}
      </Text>
    </View>
  );
}

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <MXHeader title="Terms of Service" showBack />

      <ScrollView
        contentContainerStyle={{
          padding: space.lg,
          paddingBottom: space["3xl"],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View
          style={{
            backgroundColor: colour.primary50,
            borderRadius: radius.md,
            padding: space.md,
            marginBottom: space.xl,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: colour.primary,
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            Last updated: {LAST_UPDATED}
          </Text>
          <Text style={{ fontSize: 13, color: colour.textSub, lineHeight: 20 }}>
            Please read these Terms of Service carefully before using MyExpense.
            By creating an account or using the app, you agree to be bound by
            these terms.
          </Text>
        </View>

        <Section title="1. About MyExpense">
          <Body>
            MyExpense is a mobile expense tracking and SARS ITR12 tax compliance
            application operated by MyExpense (PTY) Ltd, a company registered in
            the Republic of South Africa. The app is designed for sole
            proprietors, freelancers, and independent contractors.
          </Body>
        </Section>

        <Section title="2. Eligibility">
          <Body>
            You must be at least 18 years old and a tax-resident of South Africa
            to use MyExpense. By using the app you confirm that you meet these
            requirements.
          </Body>
        </Section>

        <Section title="3. Your Account">
          <Body style={{ marginBottom: space.sm }}>
            You are responsible for:
          </Body>
          <Bullet>
            Maintaining the confidentiality of your login credentials
          </Bullet>
          <Bullet>All activity that occurs under your account</Bullet>
          <Bullet>
            Notifying us immediately of any unauthorised access at
            support@myexpense.co.za
          </Bullet>
          <Body>
            {"\n"}We reserve the right to suspend or terminate accounts that
            violate these terms.
          </Body>
        </Section>

        <Section title="4. Permitted Use">
          <Body>
            You may use MyExpense solely for lawful personal tax and expense
            management purposes. You may not:
          </Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>Use the app for any fraudulent or unlawful purpose</Bullet>
            <Bullet>
              Attempt to reverse-engineer, decompile, or modify the app
            </Bullet>
            <Bullet>Use automated tools to scrape or extract data</Bullet>
            <Bullet>Resell or sublicense access to the app</Bullet>
          </View>
        </Section>

        <Section title="5. Subscription & Billing">
          <Body>
            MyExpense offers a free tier and a paid subscription plan at
            R99/month. Subscriptions are billed monthly or annually in advance.
            All prices are inclusive of applicable VAT.{"\n\n"}
            You may cancel your subscription at any time. Cancellation takes
            effect at the end of the current billing period. We do not offer
            refunds for partial billing periods.
          </Body>
        </Section>

        <Section title="6. Tax Information Disclaimer">
          <Body>
            MyExpense provides tools to assist with expense categorisation and
            ITR12 preparation. The app does not constitute professional tax
            advice. You remain solely responsible for the accuracy of your tax
            submissions to SARS. We recommend consulting a registered tax
            practitioner for complex tax matters.
          </Body>
        </Section>

        <Section title="7. Data & Privacy">
          <Body>
            Your use of MyExpense is also governed by our Privacy Policy, which
            is incorporated into these terms by reference. We process your
            personal information in accordance with the Protection of Personal
            Information Act (POPIA) 4 of 2013.
          </Body>
        </Section>

        <Section title="8. Intellectual Property">
          <Body>
            All content, features, and functionality of MyExpense — including
            the software, design, logos, and text — are owned by MyExpense (PTY)
            Ltd and are protected by South African and international
            intellectual property laws.
          </Body>
        </Section>

        <Section title="9. Limitation of Liability">
          <Body>
            To the maximum extent permitted by applicable law, MyExpense (PTY)
            Ltd shall not be liable for any indirect, incidental, special, or
            consequential damages arising from your use of the app, including
            but not limited to errors in tax calculations, data loss, or SARS
            penalties.
          </Body>
        </Section>

        <Section title="10. Governing Law">
          <Body>
            These terms are governed by the laws of the Republic of South
            Africa. Any disputes arising from these terms shall be subject to
            the exclusive jurisdiction of the courts of South Africa.
          </Body>
        </Section>

        <Section title="11. Changes to These Terms">
          <Body>
            We may update these terms from time to time. We will notify you of
            material changes via the app or email. Your continued use of
            MyExpense after changes are posted constitutes your acceptance of
            the updated terms.
          </Body>
        </Section>

        <Section title="12. Contact Us">
          <Body>
            If you have questions about these Terms of Service, please contact
            us:{"\n\n"}
            MyExpense (PTY) Ltd{"\n"}
            Cape Town, South Africa{"\n"}
            legal@myexpense.co.za
          </Body>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
