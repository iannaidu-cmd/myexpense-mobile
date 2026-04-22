import { IconSymbol } from '@/components/ui/icon-symbol';
import { colour, radius, space } from '@/tokens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const LOGO_W = SW * 0.58;
const LOGO_H = 42;

const OPTIONS = [
  {
    id: 'sole',
    icon: 'building.2.fill' as const,
    label: 'Sole proprietor',
    bg: colour.warningBg,
  },
  {
    id: 'freelancer',
    icon: 'briefcase.fill' as const,
    label: 'Freelancer',
    bg: colour.primary50,
  },
  {
    id: 'contractor',
    icon: 'doc.text.fill' as const,
    label: 'Independent contractor',
    bg: colour.tealLight,
  },
];

function OptionCard({
  icon,
  label,
  bg,
  selected,
  onPress,
}: {
  icon: 'building.2.fill' | 'briefcase.fill' | 'doc.text.fill';
  label: string;
  bg: string;
  selected: boolean;
  onPress: () => void;
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
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconSymbol
          name={icon}
          size={22}
          color={selected ? colour.primary : colour.textSub}
        />
      </View>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colour.text }}>
        {label}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.pill,
          borderWidth: 2,
          borderColor: selected ? colour.primary : colour.border,
          backgroundColor: selected ? colour.primary : 'transparent',
          flexShrink: 0,
        }}
      />
    </TouchableOpacity>
  );
}

export default function OnboardingStep3Screen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>

        {/* Top bar: logo + step counter */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: space.md,
            paddingBottom: space.xl,
          }}
        >
          <Image
            source={require('@/assets/images/Full-logo.gif')}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 11,
              color: colour.textSub,
              fontWeight: '600',
              letterSpacing: 0.5,
            }}
          >
            03 / 03
          </Text>
        </View>

        {/* Heading */}
        <Text
          style={{
            fontSize: 30,
            fontWeight: '800',
            color: colour.text,
            lineHeight: 36,
            marginBottom: space.sm,
          }}
        >
          Tell us about{'\n'}
          <Text style={{ color: colour.primary }}>yourself.</Text>
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: colour.textSub,
            lineHeight: 22,
            marginBottom: space.xl,
          }}
        >
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

        <View style={{ flex: 1 }} />

        {/* Progress dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginBottom: space.md,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.border,
            }}
          />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.border,
            }}
          />
          <View
            style={{
              width: 22,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.primary,
            }}
          />
        </View>

        {/* Back + Get Started */}
        <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.md }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colour.surface1,
              borderRadius: radius.pill,
              height: 56,
              paddingHorizontal: space.xl,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colour.textSub }}>
              ← Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { if (selected) router.replace('/sign-up'); }}
            activeOpacity={selected ? 0.85 : 0.5}
            style={{
              flex: 1,
              backgroundColor: selected ? colour.noir : colour.border,
              borderRadius: radius.pill,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: selected ? colour.onNoir : colour.textSub,
              }}
            >
              {selected ? 'Get started →' : 'Select one above'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign in */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: space.lg,
          }}
        >
          <Text style={{ fontSize: 14, color: colour.textSub }}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/sign-in')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colour.primary }}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
