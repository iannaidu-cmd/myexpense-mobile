import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
} from 'react-native';
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

function PhoneShell({ children, activeTab = 'Home', navigation }: {
  children: React.ReactNode; activeTab?: string; navigation?: NavigationProp<any>;
}) {
  const tabs = [
    { key: 'Home', label: 'Home', icon: NAV.Home },
    { key: 'Scan', label: 'Scan', icon: NAV.Scan },
    { key: 'Reports', label: 'Reports', icon: NAV.Reports },
    { key: 'Settings', label: 'Settings', icon: NAV.Settings },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      <View style={{ flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: 8, paddingTop: 6 }}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} onPress={() => navigation?.navigate(t.key)} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: activeTab === t.key ? C.teal : C.textSub }}>{t.icon}</Text>
            <Text style={{ fontSize: 10, marginTop: 2, color: activeTab === t.key ? C.teal : C.textSub, fontWeight: activeTab === t.key ? '700' : '400' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StatCard({ label, value, sub, color = C.navy }: { label: string; value: string; sub?: string; color?: string; }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, margin: 5 }}>
      <Text style={{ fontSize: 11, color: C.textSub, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
      {sub ? <Text style={{ fontSize: 10, color: C.textSub, marginTop: 3 }}>{sub}</Text> : null}
    </View>
  );
}

function NavRow({ icon, label, sub, onPress }: { icon: string; label: string; sub: string; onPress: () => void; }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.white }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.bgLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{label}</Text>
        <Text style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{sub}</Text>
      </View>
      <Text style={{ color: C.midNavy2, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

export default function TaxSummaryScreen({ navigation }: Props) {
  const [taxYear, setTaxYear] = useState('2024/25');

  const DEDUCTIONS = [
    { category: 'Travel & Transport', amount: 'R 16,800', itr12: 'S11(a)', pct: 88 },
    { category: 'Home Office',        amount: 'R 12,400', itr12: 'S11(a)', pct: 65 },
    { category: 'Equipment & Tools',  amount: 'R 7,800',  itr12: 'S11(e)', pct: 41 },
    { category: 'Software & Subscr.', amount: 'R 6,560',  itr12: 'S11(a)', pct: 34 },
    { category: 'Professional Fees',  amount: 'R 4,800',  itr12: 'S11(a)', pct: 25 },
    { category: 'Other Deductible',   amount: 'R 47,320', itr12: 'S11(a)', pct: 100 },
  ];

  const maxPct = Math.max(...DEDUCTIONS.map(d => d.pct));

  return (
    <PhoneShell navigation={navigation}>
      <View style={{ backgroundColor: C.navy, paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ marginBottom: 10 }}>
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Home</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: C.teal, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>TAX & ITR12</Text>
            <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>Tax Summary</Text>
          </View>
          <TouchableOpacity onPress={() => navigation?.navigate('TaxYearSelector')} style={{ backgroundColor: C.midNavy, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 }}>
            <Text style={{ color: C.white, fontSize: 12, fontWeight: '600' }}>{taxYear} ▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ backgroundColor: C.bgLighter, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, paddingBottom: 30 }}>

        {/* Key stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 11, paddingTop: 16, marginBottom: 8 }}>
          <StatCard label="Total Deductions"   value="R 95,680"  sub="Full tax year"     color={C.success} />
          <StatCard label="Est. Tax Saving"    value="R 26,390"  sub="vs no deductions"  color={C.teal}    />
          <StatCard label="Total Expenses"     value="R 138,420" sub="All categories"    color={C.navy}    />
          <StatCard label="Deduction Rate"     value="69.1%"     sub="Of total spend"    color={C.midNavy2} />
        </View>

        {/* ITR12 Readiness */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>ITR12 Readiness</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.teal }}>78%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: C.bgLight, borderRadius: 4, marginBottom: 8 }}>
            <View style={{ width: '78%', height: 8, backgroundColor: C.teal, borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 11, color: C.textSub }}>4 receipts unmatched · 2 categories need review</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('ITR12ExportSetup')} style={{ marginTop: 12, backgroundColor: C.navy, borderRadius: 10, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: C.white, fontSize: 13, fontWeight: '700' }}>Prepare ITR12 Export</Text>
          </TouchableOpacity>
        </View>

        {/* SARS Key Dates */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.navyDark, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: C.white, fontSize: 13, fontWeight: '700', marginBottom: 12 }}>🗓 SARS Key Dates — 2024/25</Text>
          {[
            { label: 'Tax year end',       date: '28 Feb 2025', done: true  },
            { label: 'eFiling opens',      date: '1 Jul 2025',  done: false },
            { label: 'Non-provisional',    date: '21 Oct 2025', done: false },
            { label: 'Provisional (auto)', date: '20 Jan 2026', done: false },
          ].map((d, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.done ? C.success : C.teal, marginRight: 10 }} />
              <Text style={{ flex: 1, fontSize: 12, color: d.done ? C.textSub : C.white }}>{d.label}</Text>
              <Text style={{ fontSize: 12, color: d.done ? C.textSub : C.teal, fontWeight: '600' }}>{d.date}</Text>
            </View>
          ))}
        </View>

        {/* Deduction breakdown bars */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14 }}>Deductions by Category</Text>
          {DEDUCTIONS.map((d, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.text }}>{d.category}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.navy }}>{d.amount}</Text>
              </View>
              <View style={{ height: 5, backgroundColor: C.bgLight, borderRadius: 3 }}>
                <View style={{ width: `${(d.pct / maxPct) * 100}%`, height: 5, backgroundColor: C.teal, borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>ITR12 {d.itr12}</Text>
            </View>
          ))}
        </View>

        {/* Quick nav */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.textSub, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 }}>Tools</Text>
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
          <NavRow icon="📤" label="ITR12 Export Setup"    sub="Configure and export your return"     onPress={() => navigation?.navigate('ITR12ExportSetup')}   />
          <NavRow icon="🏷" label="Category Breakdown"    sub="Detailed ITR12 category analysis"     onPress={() => navigation?.navigate('CategoryBreakdown')}  />
          <NavRow icon="📖" label="Deductibility Guide"   sub="Which expenses qualify under SARS"    onPress={() => navigation?.navigate('DeductibilityGuide')} />
          <NavRow icon="🏛" label="VAT Summary"           sub="Input tax & VAT201 overview"          onPress={() => navigation?.navigate('VATSummary')}         />
          <NavRow icon="🗓" label="Tax Year Selector"     sub="Switch between tax years"             onPress={() => navigation?.navigate('TaxYearSelector')}    />
        </View>
      </View>
    </PhoneShell>
  );
}
