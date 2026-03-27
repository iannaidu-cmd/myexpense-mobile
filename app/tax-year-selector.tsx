import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, StatusBar,
} from 'react-native';
import { colour, typography, space, radius } from '@/tokens';

type TaxYear = {
  id: string; label: string; period: string;
  status: 'current' | 'filing' | 'closed'; expenses: number; claimable: number;
};

const TAX_YEARS: TaxYear[] = [
  { id: 'fy2026', label: '2025/26', period: '1 Mar 2025 – 28 Feb 2026', status: 'current', expenses: 48320,  claimable: 36240 },
  { id: 'fy2025', label: '2024/25', period: '1 Mar 2024 – 28 Feb 2025', status: 'filing',  expenses: 62150,  claimable: 51200 },
  { id: 'fy2024', label: '2023/24', period: '1 Mar 2023 – 29 Feb 2024', status: 'closed',  expenses: 55400,  claimable: 44800 },
  { id: 'fy2023', label: '2022/23', period: '1 Mar 2022 – 28 Feb 2023', status: 'closed',  expenses: 41200,  claimable: 32900 },
  { id: 'fy2022', label: '2021/22', period: '1 Mar 2021 – 28 Feb 2022', status: 'closed',  expenses: 38700,  claimable: 30200 },
];

const STATUS_CONFIG = {
  current: { label: 'Current Year',  bg: colour.primaryLight,  text: colour.primary,  border: colour.primary  },
  filing:  { label: 'Filing Open',   bg: colour.warningLight,  text: colour.warning,  border: colour.warning  },
  closed:  { label: 'Closed',        bg: colour.border,        text: colour.textSecondary, border: colour.border },
} as const;

export default function TaxYearSelectorScreen({ navigation, route }: any) {
  const currentSelected = route?.params?.selectedYear ?? 'fy2026';
  const [selected, setSelected] = useState(currentSelected);

  const handleSelect = (year: TaxYear) => {
    setSelected(year.id);
    setTimeout(() => navigation?.goBack(), 150);
  };

  const fmt = (n: number) => `R ${n.toLocaleString('en-ZA')}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space['3xl'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
          <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: colour.textOnPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
          </TouchableOpacity>
          <Text style={[typography.labelM, { color: 'rgba(255,255,255,0.85)' }]}>Tax & ITR12</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={[typography.heading3, { color: colour.textOnPrimary }]}>Select Tax Year</Text>
        <Text style={[typography.bodyS, { color: 'rgba(255,255,255,0.7)', marginTop: 2 }]}>
          SARS tax year runs 1 March – 28/29 February
        </Text>
      </View>

      {/* Card */}
      <ScrollView style={{ flex: 1, backgroundColor: colour.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space['4xl'] }}>

        {/* Info banner */}
        <View style={{ backgroundColor: colour.infoLight, borderRadius: radius.md, padding: space.md, marginBottom: space.xl }}>
          <Text style={[typography.bodyS, { color: colour.info }]}>
            📅 The South African tax year runs from <Text style={{ fontWeight: '600' }}>1 March to the last day of February</Text>. ITR12 submissions for individuals typically open in July each year.
          </Text>
        </View>

        {/* Year list */}
        {TAX_YEARS.map(year => {
          const cfg = STATUS_CONFIG[year.status];
          const isSelected = selected === year.id;
          return (
            <TouchableOpacity key={year.id} onPress={() => handleSelect(year)}
              style={{ borderRadius: radius.md, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? colour.primary : colour.border, backgroundColor: isSelected ? colour.primaryLight : colour.bgCard, padding: space.lg, marginBottom: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Text style={[typography.heading4, { color: colour.textPrimary }]}>FY {year.label}</Text>
                  <View style={{ backgroundColor: cfg.bg, borderRadius: radius.full, paddingHorizontal: space.sm, paddingVertical: 2 }}>
                    <Text style={[typography.micro, { color: cfg.text, fontWeight: '600' }]}>{cfg.label}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colour.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colour.textOnPrimary, fontSize: 12, fontWeight: '700' }}>✓</Text>
                  </View>
                )}
              </View>

              <Text style={[typography.caption, { color: colour.textSecondary, marginBottom: space.md }]}>{year.period}</Text>

              <View style={{ flexDirection: 'row', gap: space.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.micro, { color: colour.textSecondary }]}>Total Expenses</Text>
                  <Text style={[typography.labelM, { color: colour.textPrimary }]}>{fmt(year.expenses)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.micro, { color: colour.textSecondary }]}>ITR12 Claimable</Text>
                  <Text style={[typography.labelM, { color: colour.success }]}>{fmt(year.claimable)}</Text>
                </View>
              </View>

              {year.status === 'filing' && (
                <View style={{ backgroundColor: colour.warningLight, borderRadius: radius.sm, padding: space.sm, marginTop: space.md }}>
                  <Text style={[typography.bodyS, { color: colour.warning }]}>
                    ⚠️ ITR12 filing is currently open for this tax year. Submit before 23 October 2025.
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
