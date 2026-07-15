import { MXBackHeader } from '@/components/MXBackHeader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colour, radius, space, typography } from '@/tokens';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LAST_UPDATED = '15 July 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: space.xl }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colour.text, marginBottom: space.sm }}>
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
    <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xs }}>
      <Text style={{ fontSize: 14, color: colour.textSub, lineHeight: 22 }}>•</Text>
      <Text style={{ flex: 1, fontSize: 14, color: colour.textSub, lineHeight: 22 }}>{children}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{
      flexDirection: 'row',
      paddingVertical: space.sm,
      borderBottomWidth: 1,
      borderBottomColor: colour.borderLight,
      gap: space.md,
    }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colour.textSub, width: 120, flexShrink: 0 }}>
        {label}
      </Text>
      <Text style={{ flex: 1, fontSize: 13, color: colour.text, lineHeight: 20 }}>
        {value}
      </Text>
    </View>
  );
}

function BasisRow({ category, examples, basis, last }: { category: string; examples: string; basis: string; last?: boolean }) {
  return (
    <View style={{
      paddingVertical: space.sm,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colour.borderLight,
      gap: 2,
    }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colour.text }}>{category}</Text>
      <Text style={{ fontSize: 12, color: colour.textHint, lineHeight: 17 }}>{examples}</Text>
      <Text style={{ fontSize: 12.5, color: colour.accentDeep, fontWeight: '600', marginTop: 2 }}>{basis}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <MXBackHeader />

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space['3xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Display title */}
        <Text style={{
          fontSize: 34, fontWeight: '800', letterSpacing: -1.2,
          color: colour.text, marginBottom: 6, lineHeight: 40,
        }}>
          Data &{'\n'}<Text style={{ color: colour.primary }}>privacy</Text>
        </Text>
        <Text style={{
          fontSize: 13, color: colour.textSub, marginBottom: space.md, lineHeight: 20,
        }}>
          How we collect, use and protect your information
        </Text>

        {/* Trust chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.xl }}>
          {['POPIA Compliant', 'TLS 1.3 Encrypted', 'No data sold'].map((chip) => (
            <View key={chip} style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colour.accentDeep }}>{chip}</Text>
            </View>
          ))}
        </View>

        {/* Intro banner */}
        <View style={{
          backgroundColor: colour.noir,
          borderRadius: radius.lg,
          padding: space.md,
          marginBottom: space.xl,
          flexDirection: 'row',
          gap: space.sm,
          alignItems: 'flex-start',
        }}>
          <View style={{
            backgroundColor: colour.primary,
            borderRadius: radius.sm,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconSymbol name="lock.fill" size={16} color={colour.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colour.onNoir, marginBottom: 2 }}>
              Last updated: {LAST_UPDATED}
            </Text>
            <Text style={{ fontSize: 12, color: colour.onNoir2, lineHeight: 18 }}>
              MyExpense is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) 4 of 2013.
            </Text>
          </View>
        </View>

        {/* Responsible party card */}
        <View style={{
          borderWidth: 1,
          borderColor: colour.borderLight,
          borderRadius: radius.md,
          padding: space.md,
          marginBottom: space.xl,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colour.text, marginBottom: space.sm }}>
            Responsible Party
          </Text>
          <InfoRow label="Company" value="MyExpense (Pty) Ltd (Reg. No. 2026/140774/07)" />
          <InfoRow label="Address" value="13 The Bend, Pinelands, 7405, Cape Town, South Africa" />
          <InfoRow label="Contact" value="privacy@myexpense.co.za" />
          <InfoRow label="Information Officer" value="Registration with the Information Regulator is in progress" />
        </View>

        <Section title="1. Information We Collect">
          <Body>We collect the following categories of personal information:</Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>Identity information: full name and email address when you register</Bullet>
            <Bullet>Financial data: expense amounts, categories, vendor names, and receipt images you upload</Bullet>
            <Bullet>Device information: device type, operating system, and app version for support purposes</Bullet>
            <Bullet>Usage data: features used, session duration, and error logs to improve the app — these are collected on an anonymised basis and are not linked back to your identity</Bullet>
            <Bullet>Location data: only when you use the mileage tracker, and only with your explicit permission</Bullet>
          </View>
        </Section>

        <Section title="2. How We Use Your Information">
          <Body>We use your personal information to:</Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>Provide and maintain the MyExpense service</Bullet>
            <Bullet>Generate SARS ITR12-compliant expense reports</Bullet>
            <Bullet>Process your subscription payments via Apple App Store, Google Play, and our subscription management provider RevenueCat</Bullet>
            <Bullet>Extract data from receipt images you scan, using an AI-assisted OCR service (see Section 6)</Bullet>
            <Bullet>Send transactional emails (receipts, password resets, verification codes)</Bullet>
            <Bullet>Improve app performance and fix bugs</Bullet>
            <Bullet>Comply with our legal obligations under South African law</Bullet>
          </View>
          <View style={{ marginTop: space.md }}>
            <Body>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</Body>
          </View>
        </Section>

        <Section title="3. Legal Basis for Processing">
          <Body>
            Under section 11 of POPIA, we process each category of your personal information on a specific lawful basis, not simply because it is convenient for us:
          </Body>
          <View style={{
            marginTop: space.sm,
            borderWidth: 1,
            borderColor: colour.borderLight,
            borderRadius: radius.md,
            padding: space.md,
          }}>
            <BasisRow
              category="Account details"
              examples="Name, email, mobile number"
              basis="Necessary for conclusion and performance of our contract with you"
            />
            <BasisRow
              category="Financial data"
              examples="Receipts, expense amounts, income, mileage, category selections"
              basis="Necessary for performance of the contract — this is the core service"
            />
            <BasisRow
              category="Tax profile information"
              examples="Taxpayer type, tax year"
              basis="Necessary for performance of the contract. MyExpense itself has no direct legal duty to SARS — it is you, the user, who does — so we do not rely on legal obligation as the basis here"
            />
            <BasisRow
              category="Device & usage data"
              examples="App version, crash logs"
              basis="Legitimate interest in maintaining service reliability, collected on an anonymised basis and never linked back to your identity"
            />
            <BasisRow
              category="Service notifications"
              examples="Filing reminders, push notifications"
              basis="Consent — opt-in, and withdrawable at any time in Settings"
              last
            />
          </View>
        </Section>

        <Section title="4. Data Storage & Security">
          <Body>
            Your data is stored on secure servers hosted by Supabase, with infrastructure located in Ireland, European Union (AWS eu-west-1). Because this means your information leaves South Africa, we rely on the following safeguards required by Section 72 of POPIA: the European Union applies the General Data Protection Regulation (GDPR), a data protection standard recognised internationally as substantially comparable to POPIA, and our hosting and processing agreements with Supabase include contractual data-protection obligations equivalent to those imposed on us directly under POPIA. We implement the following additional security measures:
          </Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>End-to-end encryption for data in transit (TLS 1.3)</Bullet>
            <Bullet>Encryption at rest for all stored data</Bullet>
            <Bullet>Biometric authentication support for device-level security</Bullet>
            <Bullet>Role-based access controls limiting data access to authorised personnel only</Bullet>
          </View>
          <View style={{ marginTop: space.md }}>
            <Body>
              While we take every reasonable precaution to protect your information, no method of electronic transmission or storage is entirely secure. In accordance with Section 22 of POPIA, if we become aware of a security compromise that has compromised or may compromise your personal information, we will notify the Information Regulator and you as soon as reasonably possible, including the nature of the compromise, what data was affected, and what steps we recommend you take.
            </Body>
          </View>
        </Section>

        <Section title="5. Data Retention">
          <Body>
            We retain your personal information for as long as your account is active, plus 5 years thereafter to comply with the record-keeping requirements of the Tax Administration Act, 2011. Receipt images are retained for 5 years in line with SARS audit requirements.{'\n\n'}
            When you delete your account, we will delete or anonymise your personal information within 30 days, except where retention is required by law.
          </Body>
        </Section>

        <Section title="6. Sharing Your Information">
          <Body>We share your information only with the following trusted service providers, who are contractually obligated to protect your data:</Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>Apple App Store / Google Play and RevenueCat: to process and manage your subscription payments</Bullet>
            <Bullet>Supabase: our database, file storage, and authentication provider</Bullet>
            <Bullet>Anthropic: when you scan a receipt, the image is sent to Anthropic's Claude AI service to extract the vendor, amount, and date automatically. Receipt images are not used by Anthropic to train their models under our agreement with them</Bullet>
            <Bullet>Sentry: to record anonymised crash and error diagnostics so we can keep the app reliable</Bullet>
            <Bullet>Google or Meta: only if you choose to sign in with Google or Facebook (subject to their own privacy policies)</Bullet>
            <Bullet>Law enforcement: only when required by a valid court order or legal obligation</Bullet>
          </View>
          <View style={{ marginTop: space.md }}>
            <Body>
              Where any service provider processes your data outside of South Africa, we ensure appropriate safeguards are in place in accordance with Section 72 of POPIA, as described in Section 4 above.
            </Body>
          </View>
        </Section>

        <Section title="7. Your POPIA Rights">
          <Body>Under POPIA, you have the right to:</Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>Access the personal information we hold about you</Bullet>
            <Bullet>Request correction of inaccurate information</Bullet>
            <Bullet>Request deletion of your information (subject to legal retention obligations)</Bullet>
            <Bullet>Export your data at any time from within the app</Bullet>
            <Bullet>Object to the processing of your information</Bullet>
            <Bullet>Lodge a complaint with the Information Regulator of South Africa (see Section 11)</Bullet>
          </View>
          <View style={{ marginTop: space.md }}>
            <Body>
              To exercise any of these rights, contact us at privacy@myexpense.co.za. We will respond within 30 days.
            </Body>
          </View>
        </Section>

        <Section title="8. Cookies & Tracking">
          <Body>
            The MyExpense mobile app does not use browser cookies. We use anonymous analytics to understand how the app is used. This data cannot be linked back to you personally and is used solely to improve app performance and stability.
          </Body>
        </Section>

        <Section title="9. Children's Privacy">
          <Body>
            MyExpense is not intended for use by persons under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal information, we will delete it promptly.
          </Body>
        </Section>

        <Section title="10. Changes to This Policy">
          <Body>
            We may update this Privacy Policy from time to time. We will notify you of material changes via the app or by email at least 14 days before the changes take effect. Your continued use of MyExpense after changes are posted constitutes acceptance of the updated policy.
          </Body>
        </Section>

        <Section title="11. Information Regulator">
          <Body>
            If you are unhappy with how we handle your personal information, or with how we have responded to a request you have made under Section 7, you may lodge a complaint with the Information Regulator of South Africa:{'\n\n'}
            Website: inforegulator.org.za{'\n'}
            Email: enquiries@inforegulator.org.za{'\n'}
            Tel: +27 (0)12 406 4818
          </Body>
        </Section>

        <Section title="12. Contact Us">
          <Body>
            For any privacy-related queries or to exercise your POPIA rights:{'\n\n'}
            MyExpense (Pty) Ltd (Reg. No. 2026/140774/07){'\n'}
            13 The Bend, Pinelands, 7405, Cape Town, South Africa{'\n'}
            privacy@myexpense.co.za
          </Body>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}
