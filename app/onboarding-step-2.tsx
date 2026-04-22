import { IconSymbol } from '@/components/ui/icon-symbol';
import { colour, radius, space } from '@/tokens';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const LOGO_W = SW * 0.58;
const LOGO_H = 42;

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
        height: 110,
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
          <IconSymbol name={item.icon} size={26} color={colour.primary} />
          <Text
            style={{
              fontSize: 10,
              color: colour.textSub,
              marginTop: 6,
              fontWeight: '600',
            }}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FeatureRow({
  icon,
  iconBg,
  title,
  subtitle,
}: {
  icon: 'camera.fill' | 'car.fill';
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        marginBottom: space.md,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.md,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconSymbol name={icon} size={22} color={colour.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colour.text,
            marginBottom: 3,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: colour.textSub, lineHeight: 18 }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingStep2Screen() {
  const router = useRouter();

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
            paddingBottom: space.sm,
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
            02 / 03
          </Text>
        </View>

        <FeaturePlaceholder />

        {/* Tag */}
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
          <Text
            style={{
              fontSize: 11,
              color: colour.primary,
              fontWeight: '700',
              letterSpacing: 0.3,
            }}
          >
            Built for South Africa
          </Text>
        </View>

        {/* Heading */}
        <Text
          style={{
            fontSize: 36,
            fontWeight: '800',
            color: colour.text,
            lineHeight: 42,
            marginBottom: space.sm,
          }}
        >
          Built for SA{'\n'}
          <Text style={{ color: colour.primary }}>freelancers.</Text>
        </Text>

        {/* Body */}
        <Text
          style={{
            fontSize: 15,
            color: colour.textSub,
            lineHeight: 22,
            marginBottom: space.lg,
          }}
        >
          Every feature designed specifically for the SA tax ecosystem — not a
          generic expense app.
        </Text>

        <FeatureRow
          icon="camera.fill"
          iconBg={colour.primary50}
          title="OCR receipt scanning"
          subtitle="AI extracts vendor, amount, date and VAT in seconds"
        />
        <FeatureRow
          icon="car.fill"
          iconBg={colour.warningBg}
          title="Mileage tracker"
          subtitle="GPS logbook at SARS deemed rate R4.84/km for 2024/25"
        />

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
              width: 22,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.primary,
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
        </View>

        {/* Back + Next */}
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
            onPress={() => router.push('/onboarding-step-3')}
            style={{
              flex: 1,
              backgroundColor: colour.noir,
              borderRadius: radius.pill,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: colour.onNoir }}>
              Next →
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
