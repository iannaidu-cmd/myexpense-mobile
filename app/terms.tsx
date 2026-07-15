import { MXBackHeader } from "@/components/MXBackHeader";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space } from "@/tokens";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LAST_UPDATED = "15 July 2026";

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

function Body({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Text style={[{ fontSize: 14, color: colour.textSub, lineHeight: 22 }, style]}>
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <MXBackHeader />

      <ScrollView
        contentContainerStyle={{
          padding: space.lg,
          paddingBottom: space["3xl"],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Display title */}
        <Text style={{
          fontSize: 34, fontWeight: "800", letterSpacing: -1.2,
          color: colour.text, marginBottom: 6, lineHeight: 40,
        }}>
          Terms of{"\n"}<Text style={{ color: colour.primary }}>service</Text>
        </Text>
        <Text style={{
          fontSize: 13, color: colour.textSub, marginBottom: space.md, lineHeight: 20,
        }}>
          App terms & conditions · South African law
        </Text>

        {/* Trust chips */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginBottom: space.xl }}>
          {["South African Law", "CPA Compliant", "ECT Act"].map((chip) => (
            <View key={chip} style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colour.accentDeep }}>{chip}</Text>
            </View>
          ))}
        </View>

        {/* Intro */}
        <View
          style={{
            backgroundColor: colour.noir,
            borderRadius: radius.lg,
            padding: space.md,
            marginBottom: space.xl,
            flexDirection: "row",
            gap: space.sm,
            alignItems: "flex-start",
          }}
        >
          <View
            style={{
              backgroundColor: colour.primary,
              borderRadius: radius.sm,
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name="doc.text.fill" size={16} color={colour.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colour.onNoir, marginBottom: 2 }}>
              Last updated: {LAST_UPDATED}
            </Text>
            <Text style={{ fontSize: 12, color: colour.onNoir2, lineHeight: 18 }}>
              Please read these Terms of Service carefully before using MyExpense.
              By creating an account or using the app, you agree to be bound by these terms.
            </Text>
          </View>
        </View>

        <Section title="1. About MyExpense">
          <Body>
            MyExpense is a mobile expense tracking and SARS ITR12 tax compliance
            application operated by MyExpense (Pty) Ltd (registration number
            2026/140774/07), a company registered in the Republic of South Africa
            with its registered address at 13 The Bend, Pinelands, 7405, Cape Town,
            South Africa. The app is designed for sole
            proprietors, freelancers, and independent contractors. These terms
            are governed by and must be interpreted in accordance with the
            Electronic Communications and Transactions Act, 2002 (ECT Act), the
            Consumer Protection Act, 2008 (CPA), and other applicable South
            African legislation.
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
            MyExpense offers a free tier and a paid subscription available on a
            monthly or annual billing cycle, at the prices shown in the app
            before purchase (currently R99.99/month or R1099.00/year). MyExpense
            (Pty) Ltd is not currently VAT registered, so no VAT is added to
            these prices. The annual plan is billed once
            per year in advance at a discounted rate compared to paying
            monthly.{"\n\n"}
            From time to time we may offer early-access or promotional periods
            of free access (for example, to the first cohort of users who join
            a waitlist). Where a free or promotional period is set to convert
            into a paid subscription, we will notify you at least 7 days before
            your first charge, by email or in-app notification, so you have the
            opportunity to cancel before being billed.{"\n\n"}
            Paid subscriptions automatically renew at the end of each billing
            cycle — monthly for the monthly plan, annually for the annual plan
            — unless cancelled. You may cancel your subscription at any time
            through the app or by contacting us at support@myexpense.co.za.
            Cancellation takes effect at the end of the current billing period
            (month or year, matching your plan) and no refund will be issued
            for the remaining portion of that period.{"\n\n"}
            We reserve the right to change subscription fees with at least 30
            days' prior notice. In accordance with the Consumer Protection Act,
            you have the right to cancel your subscription if you do not agree
            with any revised pricing.
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

        <Section title="8. Data Export & Account Deletion">
          <Body>
            You may export your expense data at any time from within the app.
            Upon deletion of your account, you will have 30 days to export your
            data before it is permanently deleted in accordance with our Privacy
            Policy. To delete your account, contact us at
            support@myexpense.co.za.
          </Body>
        </Section>

        <Section title="9. Intellectual Property">
          <Body>
            All content, features, and functionality of MyExpense — including
            the software, design, logos, and text — are owned by MyExpense (Pty)
            Ltd and are protected by South African and international
            intellectual property laws.
          </Body>
        </Section>

        <Section title="10. Limitation of Liability">
          <Body>
            To the maximum extent permitted by applicable South African law,
            including the Consumer Protection Act, MyExpense (Pty) Ltd shall not
            be liable for any indirect, incidental, special, or consequential
            damages arising from your use of the app, including but not limited
            to errors in tax calculations, data loss, or SARS penalties. Our
            total aggregate liability for any claim arising out of or related to
            the app shall not exceed the total fees paid by you in the twelve
            months preceding the claim. Nothing in this section excludes or
            limits our liability for gross negligence, fraud, or any other
            liability which section 51 of the Consumer Protection Act, or any
            other law, does not permit us to exclude or limit.
          </Body>
        </Section>

        <Section title="11. Governing Law & Jurisdiction">
          <Body>
            These terms are governed by the laws of the Republic of South
            Africa. You and MyExpense (Pty) Ltd agree to submit to the
            non-exclusive jurisdiction of the courts of South Africa for any
            dispute arising from these terms, without prejudice to your right
            as a consumer to refer a dispute to the National Consumer
            Tribunal or another applicable alternative dispute resolution
            body under the Consumer Protection Act. In the
            event of any conflict between these terms and the provisions of the
            CPA or the ECT Act, the relevant statutory provisions shall prevail.
          </Body>
        </Section>

        <Section title="12. Changes to These Terms">
          <Body>
            We may update these terms from time to time. We will notify you of
            material changes via the app or email at least 20 business days
            before the changes take effect, as required by the ECT Act. Your
            continued use of MyExpense after changes are posted constitutes your
            acceptance of the updated terms.
          </Body>
        </Section>

        <Section title="13. General Provisions">
          <Bullet>
            <Body style={{ color: colour.text }}>Severability: </Body>
            If any provision of these terms is found to be unlawful, void, or
            unenforceable, that provision will be severed and will not affect
            the validity of the remaining provisions.
          </Bullet>
          <Bullet>
            <Body style={{ color: colour.text }}>Entire agreement: </Body>
            These terms, together with our Privacy Policy, constitute the
            entire agreement between you and MyExpense (Pty) Ltd regarding your
            use of the app, and supersede any prior agreements on this subject.
          </Bullet>
          <Bullet>
            <Body style={{ color: colour.text }}>Assignment: </Body>
            You may not assign or transfer your rights under these terms
            without our written consent. We may assign these terms in
            connection with a merger, acquisition, or sale of assets, provided
            your rights under these terms are not diminished as a result.
          </Bullet>
        </Section>

        <Section title="14. Contact Us">
          <Body>
            If you have questions about these Terms of Service, please contact
            us:{"\n\n"}
            MyExpense (Pty) Ltd (Reg. No. 2026/140774/07){"\n"}
            13 The Bend, Pinelands, 7405, Cape Town, South Africa{"\n"}
            legal@myexpense.co.za
          </Body>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
