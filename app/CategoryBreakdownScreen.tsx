import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

interface Props { navigation?: NavigationProp<any>; }

const C = {
  navy: '#2E2E7A', navyDark: '#1A1A5C', teal: '#3BBFAD',
  midNavy: '#3D3D9E', midNavy2: '#5B5BB8',
  bgLight: '#E8EAF6', bgLighter: '#F5F6FF',
  white: '#FFFFFF', text: '#1A1A2E', textSub: '#6B6B9E',
  border: '#D0D3F0', success: '#27AE60', warning: '#F39C12', danger: '#E74C3C',
};

const NAV = { Home: '⊞', Scan: '⊡', Reports: '◈', Settings: '⚙' };

function PhoneShell({ children, navigation }: { children: React.ReactNode; navigation?: NavigationProp<any>; }) {
  const tabs = [{ key: 'Home', label: 'Home', icon: NAV.Home }, { key: 'Scan', label: 'Scan', icon: NAV.Scan }, { key: 'Reports', label: 'Reports', icon: NAV.Reports }, { key: 'Settings', label: 'Settings', icon: NAV.Settings }];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      <View style={{ flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: 8, paddingTop: 6 }}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} onPress={() => navigation?.navigate(t.key)} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: C.textSub }}>{t.icon}</Text>
            <Text style={{ fontSize: 10, marginTop: 2, color: C.textSub }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const CATEGORIES = [
  { name: 'Travel & Transport', icon: '🚗', itr12Code: 'S11(a)', itr12Line: '4011', amount: 16800, receipts: 42, deductPct: 100, color: C.navy,    deductible: true  },
  { name: 'Home Office',        icon: '🏠', itr12Code: 'S11(a)', itr12Line: '4018', amount: 12400, receipts: 12, deductPct: 100, color: C.teal,    deductible: true  },
  { name: 'Equipment & Tools',  icon: '🔧', itr12Code: 'S11(e)', itr12Line: '4022', amount: 7800,  receipts: 8,  deductPct: 100, color: '#5B5BB8', deductible: true  },
  { name: 'Software & Subscr.', icon: '💻', itr12Code: 'S11(a)', itr12Line: '4011', amount: 6560,  receipts: 24, deductPct: 100, color: C.success, deductible: true  },
  { name: 'Meals & Entertain.', icon: '🍽', itr12Code: 'S11(a)', itr12Line: '4011', amount: 4680,  receipts: 18, deductPct: 80,  color: C.warning, deductible: true  },
  { name: 'Professional Fees',  icon: '📋', itr12Code: 'S11(a)', itr12Line: '4011', amount: 4800,  receipts: 6,  deductPct: 100, color: '#E74C3C', deductible: true  },
  { name: 'Utilities',          icon: '⚡', itr12Code: 'S11(a)', itr12Line: '4011', amount: 2320,  receipts: 12, deductPct: 50,  color: '#8E44AD', deductible: true  },
  { name: 'Personal / Other',   icon: '👤', itr12Code: 'N/A',    itr12Line: '—',    amount: 6080,  receipts: 22, deductPct: 0,   color: '#BDC3C7', deductible: false },
];

const TOTAL_SPEND = CATEGORIES.reduce((s, c) => s + c.amount, 0);
const TOTAL_DEDUCT = CATEGORIES.filter(c => c.deductible).reduce((s, c) => s + Math.round(c.amount * c.deductPct / 100), 0);

export default function CategoryBreakdownScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Deductible' | 'Personal'>('All');

  const filtered = CATEGORIES.filter(c => {
    if (filter === 'Deductible') return c.deductible;
    if (filter === 'Personal')   return !c.deductible;
    return true;
  });

  const selectedCat = CATEGORIES.find(c => c.name === selected);

  return (
    <PhoneShell navigation={navigation}>
      <View style={{ backgroundColor: C.navy, paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ marginBottom: 10 }}>
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Tax Summary</Text>
        </TouchableOpacity>
        <Text style={{ color: C.teal, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>TAX & ITR12</Text>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>Category Breakdown</Text>
        <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>SARS ITR12 · Tax Year 2024/25</Text>
      </View>

      <View style={{ backgroundColor: C.bgLighter, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, paddingBottom: 30 }}>
        {/* Totals */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: C.navy, borderRadius: 14, padding: 14 }}>
            <Text style={{ color: C.textSub, fontSize: 11 }}>Total Spend</Text>
            <Text style={{ color: C.white, fontSize: 18, fontWeight: '800', marginTop: 4 }}>R {TOTAL_SPEND.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.textSub, fontSize: 11 }}>Deductible</Text>
            <Text style={{ color: C.success, fontSize: 18, fontWeight: '800', marginTop: 4 }}>R {TOTAL_DEDUCT.toLocaleString()}</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', backgroundColor: C.bgLight, borderRadius: 10, padding: 3 }}>
            {(['All', 'Deductible', 'Personal'] as const).map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: filter === f ? C.navy : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: filter === f ? C.white : C.textSub }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected category detail */}
        {selectedCat && (
          <View style={{ marginHorizontal: 16, backgroundColor: C.navy, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>{selectedCat.icon}</Text>
              <Text style={{ flex: 1, color: C.white, fontSize: 15, fontWeight: '700' }}>{selectedCat.name}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={{ color: C.textSub, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              {[
                { l: 'Total Spend',   v: `R ${selectedCat.amount.toLocaleString()}` },
                { l: 'Deductible',    v: `${selectedCat.deductPct}%` },
                { l: 'Receipts',      v: selectedCat.receipts.toString() },
                { l: 'ITR12 Line',    v: selectedCat.itr12Line },
              ].map((s, i) => (
                <View key={i}>
                  <Text style={{ color: C.textSub, fontSize: 10 }}>{s.l}</Text>
                  <Text style={{ color: C.white, fontSize: 13, fontWeight: '700', marginTop: 2 }}>{s.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Category rows */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
          {filtered.map((cat, i) => {
            const deductAmount = Math.round(cat.amount * cat.deductPct / 100);
            const barPct = (cat.amount / TOTAL_SPEND) * 100;
            return (
              <TouchableOpacity key={i} onPress={() => setSelected(selected === cat.name ? null : cat.name)} style={{ paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderBottomColor: C.border, backgroundColor: selected === cat.name ? C.bgLight : C.white }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: cat.color, marginRight: 10 }} />
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.text }}>{cat.name}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: cat.deductible ? C.navy : C.textSub }}>R {cat.amount.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, color: C.textSub, marginRight: 8 }}>ITR12 {cat.itr12Code}</Text>
                  {cat.deductible
                    ? <View style={{ backgroundColor: '#E8F8F3', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 9, fontWeight: '700', color: C.success }}>R {deductAmount.toLocaleString()} deductible</Text></View>
                    : <View style={{ backgroundColor: C.bgLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 9, color: C.textSub }}>Non-deductible</Text></View>
                  }
                </View>
                <View style={{ height: 4, backgroundColor: C.bgLight, borderRadius: 2 }}>
                  <View style={{ width: `${barPct}%`, height: 4, backgroundColor: cat.color, borderRadius: 2, opacity: 0.7 }} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={() => navigation?.navigate('DeductibilityGuide')} style={{ margin: 16, backgroundColor: C.bgLight, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>📖</Text>
          <Text style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: '600' }}>View Deductibility Guide</Text>
          <Text style={{ color: C.midNavy2, fontSize: 16 }}>›</Text>
        </TouchableOpacity>
      </View>
    </PhoneShell>
  );
}
