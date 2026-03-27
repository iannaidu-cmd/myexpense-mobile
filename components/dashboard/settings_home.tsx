import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/profileService';
import { colour, radius, space, typography } from '@/tokens';

// ─── Settings Row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon, label, sublabel, value, onPress,
  showChevron = true, danger = false,
  toggle, toggleValue, onToggle,
}: {
  icon: string; label: string; sublabel?: string; value?: string;
  onPress?: () => void; showChevron?: boolean; danger?: boolean;
  toggle?: boolean; toggleValue?: boolean; onToggle?: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={toggle ? 1 : 0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: space.md,
        paddingVertical: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
        backgroundColor: colour.surface1,
      }}
    >
      <View style={{
        width: 38, height: 38,
        borderRadius: radius.sm,
        backgroundColor: danger ? colour.dangerBg : colour.surface2,
        alignItems: 'center', justifyContent: 'center',
        marginRight: space.md,
      }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.bodyM, fontWeight: '600', color: danger ? colour.danger : colour.text }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>{sublabel}</Text>
        ) : null}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colour.border, true: colour.primary }}
          thumbColor={colour.white}
        />
      ) : (
        <>
          {value ? <Text style={{ ...typography.bodyXS, color: colour.textSub, marginRight: space.xs }}>{value}</Text> : null}
          {showChevron && <Text style={{ color: colour.textSub, fontSize: 18 }}>›</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────
function SettingsSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: space.xs }}>
      {title ? (
        <Text style={{
          ...typography.captionM,
          color: colour.textSub,
          letterSpacing: 0.8,
          paddingHorizontal: space.lg,
          paddingTop: space.lg,
          paddingBottom: space.sm,
        }}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: colour.borderLight, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsHomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [offlineMode, setOfflineMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [subscription, setSubscription] = useState<'free' | 'pro' | 'business'>('free');

  useEffect(() => {
    if (!user) return;
    profileService.getProfile(user.id).then((p) => {
      if (p) {
        setFullName(p.full_name ?? '');
        setSubscription(p.subscription ?? 'free');
      }
    });
  }, [user]);

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (user?.email?.[0]?.toUpperCase() ?? '?');

  const planLabel = subscription === 'free' ? 'FREE PLAN'
    : subscription === 'pro' ? 'PRO PLAN' : 'BUSINESS PLAN';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/onboarding-step-1');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{
          backgroundColor: colour.primary,
          paddingTop: space.lg,
          paddingBottom: space['3xl'],
          paddingHorizontal: space.lg,
        }}>
          <Text style={{ ...typography.captionM, color: colour.tealLight, letterSpacing: 1 }}>
            MYEXPENSE
          </Text>
          <Text style={{ ...typography.h2, fontWeight: '800', color: colour.onPrimary, marginTop: space.xxs }}>
            Settings
          </Text>
        </View>

        <View style={{
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          marginTop: -20,
          paddingBottom: space['3xl'],
        }}>

          {/* Profile Preview Card */}
          <TouchableOpacity
            onPress={() => router.push('/settings-screens')}
            style={{
              margin: space.lg,
              backgroundColor: colour.primary,
              borderRadius: radius.lg,
              padding: space.lg,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: colour.teal,
              alignItems: 'center', justifyContent: 'center',
              marginRight: space.md,
            }}>
              <Text style={{ ...typography.h4, color: colour.onPrimary, fontWeight: '800' }}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.bodyL, fontWeight: '700', color: colour.onPrimary }}>
                {fullName || 'My Profile'}
              </Text>
              <Text style={{ ...typography.bodyXS, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                {user?.email}
              </Text>
              <View style={{
                marginTop: space.xs,
                alignSelf: 'flex-start',
                backgroundColor: colour.teal,
                borderRadius: radius.sm,
                paddingHorizontal: space.sm,
                paddingVertical: 3,
              }}>
                <Text style={{ ...typography.micro, color: colour.onPrimary, fontWeight: '700' }}>
                  {planLabel}
                </Text>
              </View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>›</Text>
          </TouchableOpacity>

          {/* Account */}
          <SettingsSection title="Account">
            <SettingsRow
              icon="👤" label="Profile & Personal"
              sublabel="Name, tax number, address"
              onPress={() => router.push('/settings-screens')}
            />
            <SettingsRow
              icon="💳" label="Subscription & Billing"
              sublabel={`${planLabel} · Renews 1 Apr 2025`}
              onPress={() => router.push('/settings-screens')}
            />
            <SettingsRow
              icon="🔔" label="Notification Preferences"
              sublabel="Reminders, alerts, reports"
              onPress={() => router.push('/settings-screens')}
            />
          </SettingsSection>

          {/* Security */}
          <SettingsSection title="Security & Privacy">
            <SettingsRow
              icon="🔒" label="Security"
              sublabel="PIN, biometrics, 2FA"
              onPress={() => router.push('/settings-screens')}
            />
            <SettingsRow
              icon="🛡" label="Data & Privacy"
              sublabel="POPIA, export, delete account"
              onPress={() => router.push('/settings-screens')}
            />
          </SettingsSection>

          {/* App Preferences */}
          <SettingsSection title="App Preferences">
            <SettingsRow
              icon="🌙" label="Dark Mode"
              sublabel="Switch to dark theme"
              toggle toggleValue={darkMode} onToggle={setDarkMode}
              showChevron={false}
            />
            <SettingsRow
              icon="📶" label="Offline Mode"
              sublabel="Save data without internet"
              toggle toggleValue={offlineMode} onToggle={setOfflineMode}
              showChevron={false}
            />
            <SettingsRow
              icon="💱" label="Currency & Tax Year"
              value="ZAR · 2024/25"
              onPress={() => router.push('/tax-year-selector')}
            />
          </SettingsSection>

          {/* Support */}
          <SettingsSection title="Support">
            <SettingsRow
              icon="❓" label="Help & Support"
              sublabel="FAQs, contact, tutorials"
              onPress={() => router.push('/settings-screens')}
            />
            <SettingsRow
              icon="ℹ️" label="About MyExpense"
              sublabel="Version, legal, licences"
              onPress={() => router.push('/settings-screens')}
            />
          </SettingsSection>

          {/* Sign Out */}
          <SettingsSection title="Account Actions">
            <SettingsRow
              icon="🚪" label="Sign Out"
              onPress={handleSignOut}
              showChevron={false}
              danger
            />
          </SettingsSection>

          <Text style={{ ...typography.bodyXS, color: colour.textSub, textAlign: 'center', marginTop: space.lg }}>
            MyExpense v1.0.0 · Built for SARS ITR12
          </Text>
          <Text style={{ ...typography.bodyXS, color: colour.textSub, textAlign: 'center', marginTop: 2 }}>
            © 2025 MyExpense (PTY) Ltd
          </Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
