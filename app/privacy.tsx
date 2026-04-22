import { MXHeader } from '@/components/MXHeader';
import { colour, radius, space, typography } from '@/tokens';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LAST_UPDATED = '1 March 2025';

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

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <MXHeader title="Privacy Policy" showBack />

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space['3xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro banner */}
        <View style={{
          backgroundColor: colour.primary50,
          borderRadius: radius.md,
          padding: space.md,
          marginBottom: space.xl,
        }}>
          <Text style={{ fontSize: 13, color: colour.primary, fontWeight: '600', marginBottom: 4 }}>
            Last updated: {LAST_UPDATED}
          </Text>
          <Text style={{ fontSize: 13, color: colour.textSub, lineHeight: 20 }}>
            MyExpense is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) 4 of 2013.
          </Text>
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
          <InfoRow label="Company" value="MyExpense (PTY) Ltd" />
          <InfoRow label="Location" value="Cape Town, South Africa" />
          <InfoRow label="Contact" value="privacy@myexpense.co.za" />
          <InfoRow label="POPIA Reg." value="Registered Information Officer" />
        </View>

        <Section title="1. Information We Collect">
          <Body>We collect the following categories of personal information:</Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>Identity information: full name and email address when you register</Bullet>
            <Bullet>Financial data: expense amounts, categories, vendor names, and receipt images you upload</Bullet>
            <Bullet>Device information: device type, operating system, and app version for support purposes</Bullet>
            <Bullet>Usage data: features used, session duration, and error logs to improve the app</Bullet>
            <Bullet>Location data: only when you use the mileage tracker, and only with your explicit permission</Bullet>
          </View>
        </Section>

        <Section title="2. How We Use Your Information">
          <Body>We use your personal information to:</Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>Provide and maintain the MyExpense service</Bullet>
            <Bullet>Generate SARS ITR12-compliant expense reports</Bullet>
            <Bullet>Process your subscription payments via PayFast</Bullet>
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
            Under POPIA, we process your personal information on the following lawful bases:{'\n'}
          </Body>
          <Bullet>Contract performance: to deliver the services you have subscribed to</Bullet>
          <Bullet>Legitimate interests: to improve and secure our app</Bullet>
          <Bullet>Legal obligation: to comply with South African tax and financial regulations</Bullet>
          <Bullet>Consent: for optional features such as location tracking and marketing communications</Bullet>
        </Section>

        <Section title="4. Data Storage & Security">
          <Body>
            Your data is stored on secure servers hosted by Supabase, with infrastructure located in the European Union (AWS eu-west-1) and subject to GDPR-equivalent protections. We implement the following security measures:
          </Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>End-to-end encryption for data in transit (TLS 1.3)</Bullet>
            <Bullet>Encryption at rest for all stored data</Bullet>
            <Bullet>Biometric authentication support for device-level security</Bullet>
            <Bullet>Regular security audits and penetration testing</Bullet>
            <Bullet>Role-based access controls for all staff</Bullet>
          </View>
        </Section>

        <Section title="5. Data Retention">
          <Body>
            We retain your personal information for as long as your account is active, plus 5 years thereafter to comply with SARS record-keeping requirements under the Tax Administration Act. Receipt images are retained for 5 years in line with SARS audit requirements.{'\n\n'}
            When you delete your account, we will delete or anonymise your personal information within 30 days, except where retention is required by law.
          </Body>
        </Section>

        <Section title="6. Sharing Your Information">
          <Body>We share your information only with:</Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>PayFast: to process subscription payments (they are PCI-DSS compliant)</Bullet>
            <Bullet>Supabase: our database and authentication provider</Bullet>
            <Bullet>Google: if you use Google Sign-In (subject to Google's privacy policy)</Bullet>
            <Bullet>Law enforcement: only when required by a valid court order or legal obligation</Bullet>
          </View>
        </Section>

        <Section title="7. Your POPIA Rights">
          <Body>Under POPIA, you have the right to:</Body>
          <View style={{ marginTop: space.sm }}>
            <Bullet>Access the personal information we hold about you</Bullet>
            <Bullet>Request correction of inaccurate information</Bullet>
            <Bullet>Request deletion of your information (subject to legal retention obligations)</Bullet>
            <Bullet>Object to the processing of your information</Bullet>
            <Bullet>Lodge a complaint with the Information Regulator of South Africa</Bullet>
          </View>
          <View style={{ marginTop: space.md }}>
            <Body>
              To exercise any of these rights, contact us at privacy@myexpense.co.za. We will respond within 30 days.
            </Body>
          </View>
        </Section>

        <Section title="8. Cookies & Tracking">
          <Body>
            The MyExpense mobile app does not use browser cookies. We use anonymous analytics to understand how the app is used, which cannot be linked back to you personally. You can opt out of analytics in Settings → Privacy.
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
            If you are unhappy with how we handle your personal information, you may lodge a complaint with the Information Regulator of South Africa:{'\n\n'}
            Website: www.justice.gov.za/inforeg{'\n'}
            Email: inforeg@justice.gov.za{'\n'}
            Tel: +27 (0)12 406 4818
          </Body>
        </Section>

        <Section title="12. Contact Us">
          <Body>
            For any privacy-related queries or to exercise your POPIA rights:{'\n\n'}
            MyExpense (PTY) Ltd{'\n'}
            Cape Town, South Africa{'\n'}
            privacy@myexpense.co.za
          </Body>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}
