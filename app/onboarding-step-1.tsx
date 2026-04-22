import { IconSymbol } from '@/components/ui/icon-symbol';
import { colour, radius, space } from '@/tokens';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const LOGO_W = SW * 0.58;
const LOGO_H = 42;

// ── Page 1 hero placeholder ───────────────────────────────────────────────────
function HeroPlaceholder() {
  return (
    <View style={{ alignItems: 'center', marginBottom: space.xl }}>
      <View
        style={{
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colour.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: 150,
            height: 90,
            borderRadius: 45,
            backgroundColor: colour.primary100,
            bottom: 10,
            right: -15,
            opacity: 0.8,
            transform: [{ rotate: '-30deg' }],
          }}
        />
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colour.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colour.primary200, marginBottom: 6 }} />
          <View style={{ width: 56, height: 28, borderRadius: 14, backgroundColor: colour.primary100 }} />
        </View>
      </View>
    </View>
  );
}

// ── Page 2 feature placeholder ────────────────────────────────────────────────
const PLACEHOLDER_ITEMS = [
  { icon: 'camera.fill' as const, label: 'Scan' },
  { icon: 'car.fill' as const,    label: 'Track' },
  { icon: 'chart.bar.fill' as const, label: 'Reports' },
];

function FeaturePlaceholder() {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: space.sm,
        backgroundColor: colour.surface1,
        borderRadius: radius.xl,
        padding: space.md,
        marginBottom: space.xl,
        borderWidth: 1,
        borderColor: colour.borderLight,
        height: 100,
      }}
    >
      {PLACEHOLDER_ITEMS.map((item) => (
        <View
          key={item.label}
          style={{
            flex: 1,
            backgroundColor: colour.white,
            borderRadius: radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colour.borderLight,
          }}
        >
          <IconSymbol name={item.icon} size={24} color={colour.primary} />
          <Text style={{ fontSize: 10, color: colour.textSub, marginTop: 5, fontWeight: '600' }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Page 3 option card ────────────────────────────────────────────────────────
const OPTIONS = [
  { id: 'sole',       icon: 'building.2.fill' as const, label: 'Sole proprietor',        bg: colour.warningBg  },
  { id: 'freelancer', icon: 'briefcase.fill'  as const, label: 'Freelancer',              bg: colour.primary50  },
  { id: 'contractor', icon: 'doc.text.fill'   as const, label: 'Independent contractor',  bg: colour.tealLight  },
];

function OptionCard({
  icon, label, bg, selected, onPress,
}: {
  icon: 'building.2.fill' | 'briefcase.fill' | 'doc.text.fill';
  label: string; bg: string; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        borderWidth: 1.5,
        borderColor: selected ? colour.primary : colour.borderLight,
        borderRadius: radius.lg,
        backgroundColor: selected ? colour.primary50 : colour.white,
        paddingVertical: space.lg,
        paddingHorizontal: space.md,
        marginBottom: space.md,
      }}
    >
      <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IconSymbol name={icon} size={22} color={selected ? colour.primary : colour.textSub} />
      </View>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colour.text }}>{label}</Text>
      <View style={{ width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, borderColor: selected ? colour.primary : colour.border, backgroundColor: selected ? colour.primary : 'transparent', flexShrink: 0 }} />
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const scrollToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SW, animated: true });
    setPage(index);
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newPage = Math.round(e.nativeEvent.contentOffset.x / SW);
    setPage(newPage);
  };

  const handleNext = () => {
    if (page < 2) {
      scrollToPage(page + 1);
    } else if (selected) {
      router.replace('/sign-up');
    }
  };

  const ctaDisabled = page === 2 && !selected;
  const ctaLabel = page === 0
    ? 'Get started →'
    : page === 1
    ? 'Next →'
    : selected ? 'Get started →' : 'Select one above';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>

      {/* ── Fixed top bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: space.sm,
        }}
      >
        <Image
          source={require('@/assets/images/Full-logo.gif')}
          style={{ width: LOGO_W, height: LOGO_H }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 11, color: colour.textSub, fontWeight: '600', letterSpacing: 0.5 }}>
          {`0${page + 1} / 03`}
        </Text>
      </View>

      {/* ── Horizontal pager ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'flex-start' }}
      >

        {/* ── Page 1: Hero ── */}
        <View style={{ width: SW, paddingHorizontal: space.lg, paddingTop: space.md }}>
          <HeroPlaceholder />
          <View style={{ marginBottom: space.xl }}>
            <View
              style={{
                backgroundColor: colour.primary50,
                borderRadius: radius.pill,
                paddingHorizontal: space.md,
                paddingVertical: space.xs,
                alignSelf: 'flex-start',
                marginBottom: space.sm,
              }}
            >
              <Text style={{ fontSize: 11, color: colour.primary, fontWeight: '700', letterSpacing: 0.3 }}>
                Average unclaimed per year
              </Text>
            </View>
            <Text style={{ fontSize: 46, fontWeight: '800', color: colour.primary, letterSpacing: -1.5, lineHeight: 52 }}>
              R37,492
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: colour.textSub, lineHeight: 24 }}>
            South Africa's 3.8 million self-employed lose thousands in unclaimed
            deductions every year. MyExpense fixes that — automatically.
          </Text>
        </View>

        {/* ── Page 2: Features ── */}
        <View style={{ width: SW, paddingHorizontal: space.lg, paddingTop: space.md }}>
          <FeaturePlaceholder />
          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
              alignSelf: 'flex-start',
              marginBottom: space.sm,
            }}
          >
            <Text style={{ fontSize: 11, color: colour.primary, fontWeight: '700', letterSpacing: 0.3 }}>
              Built for South Africa
            </Text>
          </View>
          <Text style={{ fontSize: 34, fontWeight: '800', color: colour.text, lineHeight: 40, marginBottom: space.sm }}>
            Built for SA{'\n'}
            <Text style={{ color: colour.primary }}>freelancers.</Text>
          </Text>
          <Text style={{ fontSize: 15, color: colour.textSub, lineHeight: 22, marginBottom: space.lg }}>
            Every feature designed specifically for the SA tax ecosystem — not a
            generic expense app.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md }}>
            <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: colour.primary50, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconSymbol name="camera.fill" size={20} color={colour.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colour.text, marginBottom: 2 }}>OCR receipt scanning</Text>
              <Text style={{ fontSize: 12, color: colour.textSub, lineHeight: 17 }}>AI extracts vendor, amount, date and VAT in seconds</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: colour.warningBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconSymbol name="car.fill" size={20} color={colour.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colour.text, marginBottom: 2 }}>Mileage tracker</Text>
              <Text style={{ fontSize: 12, color: colour.textSub, lineHeight: 17 }}>GPS logbook at SARS deemed rate R4.84/km for 2024/25</Text>
            </View>
          </View>
        </View>

        {/* ── Page 3: Type selection ── */}
        <View style={{ width: SW, paddingHorizontal: space.lg, paddingTop: space.md }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colour.text, lineHeight: 34, marginBottom: space.sm }}>
            Tell us about{'\n'}
            <Text style={{ color: colour.primary }}>yourself.</Text>
          </Text>
          <Text style={{ fontSize: 15, color: colour.textSub, lineHeight: 22, marginBottom: space.xl }}>
            This helps us apply the right SARS ITR12 rules and deduction
            categories for your situation.
          </Text>
          {OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              icon={opt.icon}
              label={opt.label}
              bg={opt.bg}
              selected={selected === opt.id}
              onPress={() => setSelected(opt.id)}
            />
          ))}
        </View>

      </ScrollView>

      {/* ── Fixed bottom: dots + buttons + sign-in ── */}
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>

        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: space.md }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: i === page ? 22 : 6,
                height: 6,
                borderRadius: radius.pill,
                backgroundColor: i === page ? colour.primary : colour.border,
              }}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.md }}>
          {page > 0 && (
            <TouchableOpacity
              onPress={() => scrollToPage(page - 1)}
              style={{
                backgroundColor: colour.surface1,
                borderRadius: radius.pill,
                height: 56,
                paddingHorizontal: space.xl,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: colour.textSub }}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={ctaDisabled ? 0.5 : 0.85}
            style={{
              flex: 1,
              backgroundColor: ctaDisabled ? colour.border : colour.noir,
              borderRadius: radius.pill,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: ctaDisabled ? colour.textSub : colour.onNoir }}>
              {ctaLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign in */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: colour.textSub }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/sign-in')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colour.primary }}>Sign in</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
