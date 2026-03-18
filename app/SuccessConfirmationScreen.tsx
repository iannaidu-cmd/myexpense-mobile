import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';

// ─── Types ────────────────────────────────────────────────────────────────────
type SuccessContext =
  | 'expense_saved'
  | 'receipt_scanned'
  | 'expense_deleted'
  | 'profile_updated'
  | 'subscription_activated'
  | 'export_complete'
  | 'itr12_ready'
  | 'password_changed'
  | 'generic';

interface SuccessDetail {
  label: string;
  value: string;
}

interface Props {
  navigation?: NavigationProp<any>;
  context?: SuccessContext;
  /** Shown inside the confirmation card */
  details?: SuccessDetail[];
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  /** Auto-dismiss after ms (0 = no auto dismiss) */
  autoDismissMs?: number;
}

// ─── Brand Colours ────────────────────────────────────────────────────────────
const C = {
  navy:      '#2E2E7A',
  navyDark:  '#1A1A5C',
  teal:      '#3BBFAD',
  midNavy2:  '#5B5BB8',
  bgLight:   '#E8EAF6',
  bgLighter: '#F5F6FF',
  white:     '#FFFFFF',
  text:      '#1A1A2E',
  textSub:   '#6B6B9E',
  border:    '#D0D3F0',
  success:   '#27AE60',
  warning:   '#F39C12',
  danger:    '#E74C3C',
};

const NAV_ICONS = { Home: '⊞', Scan: '⊡', Reports: '◈', Settings: '⚙' };

function PhoneShell({
  children,
  activeTab = 'Home',
  navigation,
}: {
  children: React.ReactNode;
  activeTab?: string;
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
            <Text style={{ fontSize: 20, color: activeTab === t.key ? C.teal : C.textSub }}>
              {t.icon}
            </Text>
            <Text style={{
              fontSize: 10, marginTop: 2,
              color: activeTab === t.key ? C.teal : C.textSub,
              fontWeight: activeTab === t.key ? '700' : '400',
            }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Animated Checkmark ───────────────────────────────────────────────────────
function AnimatedCheckmark() {
  const scale    = useRef(new Animated.Value(0)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOp   = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Pop in
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      // Ring pulse out
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 1.6, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ringOp,   { toValue: 0,   duration: 500, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
      {/* Ripple ring */}
      <Animated.View style={{
        position: 'absolute',
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 3, borderColor: C.success,
        transform: [{ scale: ringScale }],
        opacity: ringOp,
      }} />
      {/* Main circle */}
      <Animated.View style={{
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: C.success,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale }], opacity,
        shadowColor: C.success, shadowOpacity: 0.35,
        shadowRadius: 12, elevation: 8,
      }}>
        <Text style={{ color: C.white, fontSize: 44, lineHeight: 52 }}>✓</Text>
      </Animated.View>
    </View>
  );
}

// ─── Context Config Map ───────────────────────────────────────────────────────
const CONTEXT_CONFIG: Record<SuccessContext, {
  title:     string;
  subtitle:  string;
  primary:   string;
  secondary: string | null;
  navTarget: string;
  tip?:      string;
}> = {
  expense_saved: {
    title:    'Expense Saved!',
    subtitle: 'Your expense has been recorded and categorised.',
    primary:  'Add Another',
    secondary: 'View Expenses',
    navTarget: 'AddExpense',
    tip: '💡 Keep capturing receipts to maximise your ITR12 deductions.',
  },
  receipt_scanned: {
    title:    'Receipt Scanned!',
    subtitle: 'OCR data extracted. Review the details before saving.',
    primary:  'Review Expense',
    secondary: 'Scan Another',
    navTarget: 'ReceiptReview',
    tip: '📋 Double-check the ITR12 category before saving.',
  },
  expense_deleted: {
    title:    'Expense Deleted',
    subtitle: 'The expense record has been permanently removed.',
    primary:  'Back to Expenses',
    secondary: null,
    navTarget: 'ExpenseHistory',
  },
  profile_updated: {
    title:    'Profile Updated!',
    subtitle: 'Your personal details have been saved successfully.',
    primary:  'Back to Settings',
    secondary: null,
    navTarget: 'SettingsHome',
  },
  subscription_activated: {
    title:    'Pro Plan Activated!',
    subtitle: 'Welcome to MyExpense Pro. Unlimited expenses, OCR scanning, and full ITR12 reporting are now unlocked.',
    primary:  'Start Capturing',
    secondary: 'Explore Reports',
    navTarget: 'AddExpense',
    tip: '⭐ Pro tip: scan your backlog of receipts to get caught up instantly.',
  },
  export_complete: {
    title:    'Export Complete!',
    subtitle: 'Your data has been exported and is ready to share.',
    primary:  'Share File',
    secondary: 'Back to Reports',
    navTarget: 'ReportsHome',
  },
  itr12_ready: {
    title:    'ITR12 Report Ready!',
    subtitle: 'Your SARS ITR12 deduction summary has been generated for the 2024/25 tax year.',
    primary:  'View Report',
    secondary: 'Share with Accountant',
    navTarget: 'DeductionForecast',
    tip: '📅 Filing deadline: 31 October 2025.',
  },
  password_changed: {
    title:    'Password Changed!',
    subtitle: 'Your password has been updated. All other sessions have been signed out.',
    primary:  'Back to Security',
    secondary: null,
    navTarget: 'Security',
  },
  generic: {
    title:    'Done!',
    subtitle: 'Your action was completed successfully.',
    primary:  'Continue',
    secondary: null,
    navTarget: 'Home',
  },
};

// ─── SCREEN: Success Confirmation ────────────────────────────────────────────
export default function SuccessConfirmationScreen({
  navigation,
  context = 'expense_saved',
  details = [],
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  autoDismissMs = 0,
}: Props) {

  const cfg = CONTEXT_CONFIG[context];

  const [countdown, setCountdown] = useState(
    autoDismissMs > 0 ? Math.round(autoDismissMs / 1000) : null
  );

  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 400, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeIn,  { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!autoDismissMs || !countdown) return;
    if (countdown <= 0) {
      handlePrimary();
      return;
    }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, autoDismissMs]);

  const handlePrimary   = onPrimary   ?? (() => navigation?.navigate(cfg.navTarget));
  const handleSecondary = onSecondary ?? (() => navigation?.navigate('Home'));

  // Default detail rows for expense_saved / receipt_scanned
  const displayDetails: SuccessDetail[] = details.length > 0 ? details : (
    context === 'expense_saved' ? [
      { label: 'Amount',    value: 'R 1,200.00'         },
      { label: 'Category',  value: 'Travel & Transport' },
      { label: 'ITR12',     value: 'Section 11(a)'      },
      { label: 'Date',      value: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) },
    ] : context === 'itr12_ready' ? [
      { label: 'Tax Year',        value: '2024 / 2025'   },
      { label: 'Total Deductions', value: 'R 95,680.00' },
      { label: 'Estimated Saving', value: 'R 26,390.00' },
    ] : []
  );

  return (
    <PhoneShell activeTab="Home" navigation={navigation}>
      {/* Header */}
      <View style={{
        backgroundColor: C.success,
        paddingTop: 52, paddingBottom: 32,
        paddingHorizontal: 20,
      }}>
        <Text style={{ color: `${C.white}80`, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
          MYEXPENSE
        </Text>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
          Success
        </Text>
      </View>

      {/* Body */}
      <View style={{
        flex: 1,
        backgroundColor: C.bgLighter,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        marginTop: -16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 32,
      }}>
        {/* Checkmark */}
        <View style={{ marginBottom: 24 }}>
          <AnimatedCheckmark />
        </View>

        <Animated.View style={{
          width: '100%', alignItems: 'center',
          transform: [{ translateY: slideUp }], opacity: fadeIn,
        }}>
          {/* Title */}
          <Text style={{
            fontSize: 24, fontWeight: '800', color: C.text,
            textAlign: 'center', marginBottom: 10,
          }}>
            {cfg.title}
          </Text>
          <Text style={{
            fontSize: 14, color: C.textSub,
            textAlign: 'center', lineHeight: 22, marginBottom: 24,
          }}>
            {cfg.subtitle}
          </Text>

          {/* Detail card */}
          {displayDetails.length > 0 && (
            <View style={{
              width: '100%', backgroundColor: C.white,
              borderRadius: 14, overflow: 'hidden',
              borderWidth: 1, borderColor: C.border, marginBottom: 24,
            }}>
              {displayDetails.map((d, i) => (
                <View key={i} style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16, paddingVertical: 12,
                  borderBottomWidth: i < displayDetails.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}>
                  <Text style={{ fontSize: 13, color: C.textSub }}>{d.label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{d.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Primary CTA */}
          <TouchableOpacity
            onPress={handlePrimary}
            style={{
              backgroundColor: C.success,
              borderRadius: 14, paddingVertical: 15,
              width: '100%', alignItems: 'center', marginBottom: 12,
            }}
          >
            <Text style={{ color: C.white, fontSize: 15, fontWeight: '700' }}>
              {primaryLabel ?? cfg.primary}
              {countdown !== null ? ` (${countdown})` : ''}
            </Text>
          </TouchableOpacity>

          {/* Secondary CTA */}
          {cfg.secondary && (
            <TouchableOpacity
              onPress={handleSecondary}
              style={{
                borderWidth: 2, borderColor: C.navy,
                borderRadius: 14, paddingVertical: 14,
                width: '100%', alignItems: 'center',
              }}
            >
              <Text style={{ color: C.navy, fontSize: 15, fontWeight: '700' }}>
                {secondaryLabel ?? cfg.secondary}
              </Text>
            </TouchableOpacity>
          )}

          {/* Contextual tip */}
          {cfg.tip && (
            <View style={{
              width: '100%', marginTop: 20,
              backgroundColor: C.bgLight, borderRadius: 12, padding: 14,
              flexDirection: 'row', alignItems: 'flex-start',
            }}>
              <Text style={{ flex: 1, fontSize: 12, color: C.textSub, lineHeight: 18 }}>
                {cfg.tip}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </PhoneShell>
  );
}
