import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';

// ─── Types ────────────────────────────────────────────────────────────────────
type UpgradeTrigger =
  | 'ocr_limit'
  | 'expense_limit'
  | 'reports_locked'
  | 'export_locked'
  | 'budget_locked'
  | 'forecast_locked'
  | 'vat_locked'
  | 'generic';

interface Props {
  navigation?: NavigationProp<any>;
  /** What feature gate triggered the paywall */
  trigger?: UpgradeTrigger;
  onUpgrade?: (plan: 'pro' | 'pro_plus') => void;
  onDismiss?: () => void;
  onRestorePurchase?: () => void;
}

// ─── Brand Colours ────────────────────────────────────────────────────────────
const C = {
  navy:      '#2E2E7A',
  navyDark:  '#1A1A5C',
  teal:      '#3BBFAD',
  midNavy:   '#3D3D9E',
  midNavy2:  '#5B5BB8',
  bgLight:   '#E8EAF6',
  bgLighter: '#F5F6FF',
  white:     '#FFFFFF',
  text:      '#1A1A2E',
  textSub:   '#6B6B9E',
  border:    '#D0D3F0',
  success:   '#27AE60',
  warning:   '#F39C12',
  gold:      '#F4C542',
};

const NAV_ICONS = { Home: '⊞', Scan: '⊡', Reports: '◈', Settings: '⚙' };

function PhoneShell({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation?: NavigationProp<any>;
}) {
  const tabs = [
    { key: 'Home',     label: 'Home',     icon: NAV_ICONS.Home     },
    { key: 'Scan',     label: 'Scan',     icon: NAV_ICONS.Scan     },
    { key: 'Reports',  label: 'Reports',  icon: NAV_ICONS.Reports  },
    { key: 'Settings', label: 'Settings', icon: NAV_ICONS.Settings },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <View style={{ flex: 1 }}>{children}</View>
      <View style={{
        flexDirection: 'row', backgroundColor: C.white,
        borderTopWidth: 1, borderTopColor: C.border,
        paddingBottom: 8, paddingTop: 6,
      }}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => navigation?.navigate(t.key)}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 20, color: C.textSub }}>{t.icon}</Text>
            <Text style={{ fontSize: 10, marginTop: 2, color: C.textSub }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Trigger Config Map ───────────────────────────────────────────────────────
const TRIGGER_CONFIG: Record<UpgradeTrigger, {
  icon:     string;
  badge:    string;
  title:    string;
  message:  string;
  lockedFeature: string;
}> = {
  ocr_limit: {
    icon:    '📷',
    badge:   'OCR LIMIT REACHED',
    title:   'Unlock Unlimited Scanning',
    message: 'You\'ve used your 5 free OCR scans this month. Upgrade to Pro for unlimited receipt scanning with automatic ITR12 categorisation.',
    lockedFeature: 'OCR Receipt Scanning',
  },
  expense_limit: {
    icon:    '🧾',
    badge:   'LIMIT REACHED',
    title:   'Unlock Unlimited Expenses',
    message: 'The Free plan is limited to 20 expenses per month. You\'ve reached that limit. Upgrade to Pro to capture every expense without restriction.',
    lockedFeature: 'Unlimited Expenses',
  },
  reports_locked: {
    icon:    '📊',
    badge:   'PRO FEATURE',
    title:   'Unlock Advanced Reports',
    message: 'Detailed reports — including Monthly Trend, Budget vs Actual, and Deduction Forecast — are available on the Pro plan.',
    lockedFeature: 'Advanced Reporting',
  },
  export_locked: {
    icon:    '📤',
    badge:   'PRO FEATURE',
    title:   'Unlock Data Export',
    message: 'Export your ITR12 summary, CSV records, and full reports with a Pro subscription.',
    lockedFeature: 'Data Export',
  },
  budget_locked: {
    icon:    '🎯',
    badge:   'PRO FEATURE',
    title:   'Unlock Budget Tracking',
    message: 'Set monthly category budgets and get alerts when you\'re over — available on Pro.',
    lockedFeature: 'Budget vs Actual',
  },
  forecast_locked: {
    icon:    '🔮',
    badge:   'PRO FEATURE',
    title:   'Unlock Deduction Forecast',
    message: 'See your projected SARS ITR12 tax savings for the full tax year — a Pro exclusive.',
    lockedFeature: 'Deduction Forecast',
  },
  vat_locked: {
    icon:    '🏛',
    badge:   'PRO+ FEATURE',
    title:   'Unlock VAT Tracking',
    message: 'VAT tracking, VAT201 generation, and client invoicing are exclusive to the Pro+ plan.',
    lockedFeature: 'VAT Tracking & VAT201',
  },
  generic: {
    icon:    '⭐',
    badge:   'UPGRADE',
    title:   'Unlock the Full Experience',
    message: 'This feature is available to Pro and Pro+ subscribers. Upgrade now to access the full power of MyExpense.',
    lockedFeature: 'Premium Feature',
  },
};

// ─── Plan Feature Row ─────────────────────────────────────────────────────────
function FeatureRow({
  label,
  free,
  pro,
  proPlus,
  highlight,
}: {
  label: string;
  free: string | boolean;
  pro:  string | boolean;
  proPlus: string | boolean;
  highlight?: boolean;
}) {
  const cell = (val: string | boolean) => {
    if (val === true)  return <Text style={{ fontSize: 16, textAlign: 'center' }}>✓</Text>;
    if (val === false) return <Text style={{ fontSize: 14, color: C.textSub, textAlign: 'center' }}>–</Text>;
    return <Text style={{ fontSize: 11, fontWeight: '600', color: C.text, textAlign: 'center' }}>{val}</Text>;
  };

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10, paddingHorizontal: 12,
      backgroundColor: highlight ? C.bgLight : C.white,
      borderBottomWidth: 1, borderBottomColor: C.border,
    }}>
      <Text style={{ flex: 2, fontSize: 12, color: C.text, fontWeight: highlight ? '700' : '500' }}>
        {label}
      </Text>
      <View style={{ flex: 1, alignItems: 'center' }}>{cell(free)}</View>
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: highlight ? `${C.navy}15` : 'transparent', borderRadius: 4, paddingVertical: 2 }}>{cell(pro)}</View>
      <View style={{ flex: 1, alignItems: 'center' }}>{cell(proPlus)}</View>
    </View>
  );
}

// ─── SCREEN: Paywall / Upgrade ────────────────────────────────────────────────
export default function PaywallUpgradeScreen({
  navigation,
  trigger = 'generic',
  onUpgrade,
  onDismiss,
  onRestorePurchase,
}: Props) {

  const cfg = TRIGGER_CONFIG[trigger];
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'pro_plus'>('pro');

  const shimmer = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const prices = {
    pro:      billingCycle === 'monthly' ? 'R 99/mo'  : 'R 79/mo',
    pro_plus: billingCycle === 'monthly' ? 'R 199/mo' : 'R 159/mo',
  };

  const shimX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-120, 200] });

  const handleUpgrade = () => {
    (onUpgrade ?? (() => navigation?.navigate('SubscriptionBilling')))(selectedPlan);
  };

  const handleDismiss = onDismiss ?? (() => navigation?.goBack());

  // Feature gate note — the locked feature shown at top
  const isProPlusTrigger = trigger === 'vat_locked';

  return (
    <PhoneShell navigation={navigation}>
      {/* Dismiss X */}
      <View style={{ position: 'absolute', top: 52, right: 16, zIndex: 10 }}>
        <TouchableOpacity
          onPress={handleDismiss}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: `${C.white}30`,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: C.white, fontSize: 16, fontWeight: '700' }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={{
        backgroundColor: C.navyDark,
        paddingTop: 52, paddingBottom: 32,
        paddingHorizontal: 20, alignItems: 'center',
      }}>
        {/* Shimmer badge */}
        <Animated.View style={{ transform: [{ scale: badgeScale }], marginBottom: 14 }}>
          <View style={{
            overflow: 'hidden',
            backgroundColor: C.gold,
            borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
          }}>
            <Animated.View style={{
              position: 'absolute', top: 0, bottom: 0, left: 0,
              width: 60, backgroundColor: 'rgba(255,255,255,0.35)',
              transform: [{ translateX: shimX }, { skewX: '-20deg' }],
            }} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: C.navyDark, letterSpacing: 1 }}>
              {cfg.badge}
            </Text>
          </View>
        </Animated.View>

        <Text style={{ fontSize: 30, marginBottom: 8 }}>{cfg.icon}</Text>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
          {cfg.title}
        </Text>
        <Text style={{ color: C.textSub, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
          {cfg.message}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: C.bgLighter }}
        contentContainerStyle={{
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          marginTop: -16, paddingBottom: 32,
        }}
      >
        <View style={{ paddingTop: 20 }}>
          {/* Locked feature chip */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: '#FEF0EF', borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 6,
              borderWidth: 1, borderColor: `${C.warning}40`,
            }}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>🔒</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.warning }}>
                {cfg.lockedFeature} — {isProPlusTrigger ? 'Pro+ Only' : 'Pro Plan Required'}
              </Text>
            </View>
          </View>

          {/* Billing toggle */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View style={{
              flexDirection: 'row', backgroundColor: C.bgLight,
              borderRadius: 10, padding: 3,
            }}>
              {(['monthly', 'annual'] as const).map(cycle => (
                <TouchableOpacity
                  key={cycle}
                  onPress={() => setBillingCycle(cycle)}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 8,
                    backgroundColor: billingCycle === cycle ? C.navy : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: '600',
                    color: billingCycle === cycle ? C.white : C.textSub,
                  }}>
                    {cycle === 'monthly' ? 'Monthly' : '🏷 Annual — Save 20%'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Plan Selector Cards */}
          <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {(['pro', 'pro_plus'] as const).map(plan => {
              const active = selectedPlan === plan;
              return (
                <TouchableOpacity
                  key={plan}
                  onPress={() => setSelectedPlan(plan)}
                  style={{
                    flex: 1,
                    backgroundColor: active ? C.navy : C.white,
                    borderRadius: 16, padding: 16,
                    borderWidth: 2,
                    borderColor: active ? C.teal : C.border,
                  }}
                >
                  {plan === 'pro_plus' && (
                    <View style={{
                      backgroundColor: C.gold, borderRadius: 6,
                      paddingHorizontal: 6, paddingVertical: 2,
                      alignSelf: 'flex-start', marginBottom: 8,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: C.navyDark }}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 15, fontWeight: '800', color: active ? C.white : C.text, marginBottom: 4 }}>
                    {plan === 'pro' ? 'Pro' : 'Pro+'}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: active ? C.teal : C.navy }}>
                    {prices[plan]}
                  </Text>
                  {billingCycle === 'annual' && (
                    <Text style={{ fontSize: 10, color: active ? C.textSub : C.textSub, marginTop: 2 }}>
                      billed annually
                    </Text>
                  )}
                  {active && (
                    <View style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: C.teal,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ color: C.white, fontSize: 11, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feature comparison table */}
          <View style={{
            marginHorizontal: 16, borderRadius: 14, overflow: 'hidden',
            borderWidth: 1, borderColor: C.border, marginBottom: 16,
          }}>
            {/* Table header */}
            <View style={{ flexDirection: 'row', backgroundColor: C.navy, padding: 12 }}>
              <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: C.white }}>Feature</Text>
              {['Free', 'Pro', 'Pro+'].map(h => (
                <Text key={h} style={{ flex: 1, fontSize: 11, fontWeight: '700', color: h === 'Pro' ? C.teal : C.white, textAlign: 'center' }}>
                  {h}
                </Text>
              ))}
            </View>
            <FeatureRow label="Expenses/month"       free="20"    pro="Unlimited" proPlus="Unlimited" />
            <FeatureRow label="OCR Receipt Scanning" free="5/mo"  pro={true}      proPlus={true}      highlight />
            <FeatureRow label="ITR12 Categories"     free="Basic" pro="Full"      proPlus="Full"      />
            <FeatureRow label="Reports & Analytics"  free={false} pro={true}      proPlus={true}      highlight />
            <FeatureRow label="Budget Tracking"      free={false} pro={true}      proPlus={true}      />
            <FeatureRow label="Deduction Forecast"   free={false} pro={true}      proPlus={true}      highlight />
            <FeatureRow label="Data Export"          free={false} pro={true}      proPlus={true}      />
            <FeatureRow label="VAT Tracking / VAT201" free={false} pro={false}    proPlus={true}      highlight />
            <FeatureRow label="Accountant Portal"    free={false} pro={false}     proPlus={true}      />
            <FeatureRow label="Priority Support"     free={false} pro={false}     proPlus={true}      highlight />
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleUpgrade}
            style={{
              marginHorizontal: 16,
              backgroundColor: C.teal,
              borderRadius: 14, paddingVertical: 16,
              alignItems: 'center', marginBottom: 10,
            }}
          >
            <Text style={{ color: C.white, fontSize: 16, fontWeight: '800' }}>
              Upgrade to {selectedPlan === 'pro' ? 'Pro' : 'Pro+'} — {prices[selectedPlan]}
            </Text>
            {billingCycle === 'annual' && (
              <Text style={{ color: `${C.white}80`, fontSize: 11, marginTop: 3 }}>
                Billed annually · Cancel anytime
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDismiss}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ color: C.textSub, fontSize: 13 }}>Maybe later</Text>
          </TouchableOpacity>

          {/* Restore purchase */}
          <TouchableOpacity
            onPress={onRestorePurchase ?? (() => {})}
            style={{ alignItems: 'center', paddingVertical: 6 }}
          >
            <Text style={{ color: C.midNavy2, fontSize: 12, fontWeight: '600' }}>
              Restore Purchase
            </Text>
          </TouchableOpacity>

          {/* Trust signals */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 24, marginTop: 8, gap: 18, flexWrap: 'wrap' }}>
            {['🔒 Secure payment', '↩ Cancel anytime', '🇿🇦 ZAR billing'].map(t => (
              <Text key={t} style={{ fontSize: 11, color: C.textSub }}>{t}</Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </PhoneShell>
  );
}
