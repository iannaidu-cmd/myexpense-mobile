import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
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

function PhoneShell({ children, navigation }: { children: React.ReactNode; navigation?: NavigationProp<any>; }) {
  const tabs = [{ key: 'Home', label: 'Home', icon: NAV.Home }, { key: 'Scan', label: 'Scan', icon: NAV.Scan }, { key: 'Reports', label: 'Reports', icon: NAV.Reports }, { key: 'Settings', label: 'Settings', icon: NAV.Settings }];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
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

// ─── OCR Confidence badge ─────────────────────────────────────────────────────
function ConfidenceBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? C.success : pct >= 70 ? C.warning : C.danger;
  const label = pct >= 90 ? 'High confidence' : pct >= 70 ? 'Review recommended' : 'Low confidence';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${color}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 6 }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{pct}% · {label}</Text>
    </View>
  );
}

// ─── Editable review field ────────────────────────────────────────────────────
function ReviewField({ label, value, onChange, confidence, highlight }: {
  label: string; value: string; onChange: (v: string) => void;
  confidence?: number; highlight?: boolean;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.textSub, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {label}
        </Text>
        {confidence !== undefined && <ConfidenceBadge pct={confidence} />}
      </View>
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: highlight ? C.warning : C.border, paddingBottom: 8 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          style={{ fontSize: 15, color: C.text }}
          placeholderTextColor={C.textSub}
        />
      </View>
      {highlight && (
        <Text style={{ fontSize: 11, color: C.warning, marginTop: 4 }}>⚠ Please verify this field</Text>
      )}
    </View>
  );
}

const ITR12_CATS = [
  { label: 'Travel & Transport', icon: '🚗', code: 'S11(a)' },
  { label: 'Home Office',        icon: '🏠', code: 'S11(a)' },
  { label: 'Equipment & Tools',  icon: '🔧', code: 'S11(e)' },
  { label: 'Software & Subscr.', icon: '💻', code: 'S11(a)' },
  { label: 'Meals & Entertain.', icon: '🍽', code: 'S11(a)' },
  { label: 'Professional Fees',  icon: '📋', code: 'S11(a)' },
  { label: 'Utilities',          icon: '⚡', code: 'S11(a)' },
  { label: 'Personal / Other',   icon: '👤', code: 'N/A'    },
];

export default function ReceiptReviewScreen({ navigation }: Props) {
  // Simulated OCR-extracted values
  const [vendor,    setVendor]    = useState('Engen Fuel (PTY) Ltd');
  const [amount,    setAmount]    = useState('650.00');
  const [date,      setDate]      = useState('15/03/2025');
  const [vatNum,    setVatNum]    = useState('4012345678');
  const [vatAmount, setVatAmount] = useState('84.78');
  const [category,  setCategory]  = useState('Travel & Transport');
  const [expType,   setExpType]   = useState<'business' | 'personal'>('business');
  const [note,      setNote]      = useState('');
  const [showCats,  setShowCats]  = useState(false);

  // Simulated OCR confidence scores
  const confidence = { vendor: 97, amount: 99, date: 94, vatNum: 72 };

  const selectedCat = ITR12_CATS.find(c => c.label === category);

  return (
    <PhoneShell navigation={navigation}>
      {/* Header */}
      <View style={{ backgroundColor: C.navy, paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ marginBottom: 10 }}>
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Scan again</Text>
        </TouchableOpacity>
        <Text style={{ color: C.teal, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>OCR COMPLETE</Text>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>Review Receipt</Text>
        <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>Verify the extracted details before saving</Text>
      </View>

      <View style={{ backgroundColor: C.bgLighter, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, paddingBottom: 30 }}>

        {/* Receipt thumbnail placeholder */}
        <View style={{ marginHorizontal: 16, marginTop: 20, marginBottom: 16, height: 130, backgroundColor: C.bgLight, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36 }}>🧾</Text>
          <Text style={{ fontSize: 12, color: C.textSub, marginTop: 8 }}>Receipt image preview</Text>
          <TouchableOpacity style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 12, color: C.teal, fontWeight: '600' }}>View full image</Text>
          </TouchableOpacity>
        </View>

        {/* OCR summary banner */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.navy, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 20, marginRight: 10 }}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.white, fontSize: 13, fontWeight: '700' }}>OCR extracted 5 fields</Text>
            <Text style={{ color: C.textSub, fontSize: 12, marginTop: 3 }}>1 field needs your review · VAT number confidence low</Text>
          </View>
        </View>

        {/* Expense type toggle */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14 }}>Expense Type</Text>
          <View style={{ flexDirection: 'row', backgroundColor: C.bgLight, borderRadius: 10, padding: 3 }}>
            {(['business', 'personal'] as const).map(t => (
              <TouchableOpacity key={t} onPress={() => setExpType(t)} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: expType === t ? C.navy : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: expType === t ? C.white : C.textSub }}>
                  {t === 'business' ? '💼 Business' : '👤 Personal'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Extracted fields */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.white, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 18 }}>Extracted Details</Text>
          <ReviewField label="Vendor / Supplier"   value={vendor}    onChange={setVendor}    confidence={confidence.vendor}  />
          <ReviewField label="Amount (ZAR)"        value={amount}    onChange={setAmount}    confidence={confidence.amount}  />
          <ReviewField label="Date"                value={date}      onChange={setDate}      confidence={confidence.date}    />
          <ReviewField label="Supplier VAT Number" value={vatNum}    onChange={setVatNum}    confidence={confidence.vatNum}  highlight={confidence.vatNum < 80} />
          <ReviewField label="VAT Amount (R)"      value={vatAmount} onChange={setVatAmount} />
        </View>

        {/* Category */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.white, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14 }}>ITR12 Category</Text>
          <TouchableOpacity onPress={() => setShowCats(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 10, marginBottom: 10 }}>
            <Text style={{ flex: 1, fontSize: 15, color: C.text }}>
              {selectedCat ? `${selectedCat.icon}  ${selectedCat.label}` : 'Select…'}
            </Text>
            <Text style={{ color: C.midNavy2, fontSize: 16 }}>{showCats ? '∨' : '›'}</Text>
          </TouchableOpacity>
          {selectedCat && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: '#E8F8F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.success }}>✓ ITR12 {selectedCat.code}</Text>
              </View>
              <View style={{ backgroundColor: C.bgLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 11, color: C.textSub }}>Auto-matched by OCR</Text>
              </View>
            </View>
          )}
          {showCats && (
            <View style={{ marginTop: 10 }}>
              {ITR12_CATS.map(cat => (
                <TouchableOpacity key={cat.label} onPress={() => { setCategory(cat.label); setShowCats(false); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ fontSize: 18, marginRight: 12 }}>{cat.icon}</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: C.text }}>{cat.label}</Text>
                  <Text style={{ fontSize: 11, color: C.teal, fontWeight: '600' }}>{cat.code}</Text>
                  {category === cat.label && <Text style={{ color: C.teal, marginLeft: 8, fontWeight: '800' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Note */}
        <View style={{ marginHorizontal: 16, backgroundColor: C.white, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14 }}>Add a Note (optional)</Text>
          <TextInput value={note} onChangeText={setNote} placeholder="Memo or description…" placeholderTextColor={C.textSub} style={{ fontSize: 14, color: C.text, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 10 }} />
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => navigation?.navigate('SuccessConfirmation', { context: 'receipt_scanned' })}
          style={{ marginHorizontal: 16, backgroundColor: C.teal, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 }}
        >
          <Text style={{ color: C.white, fontSize: 15, fontWeight: '700' }}>Save Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.navigate('ScanReceiptCamera')} style={{ marginHorizontal: 16, borderWidth: 2, borderColor: C.navy, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: C.navy, fontSize: 15, fontWeight: '700' }}>Scan Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ color: C.textSub, fontSize: 13 }}>Discard</Text>
        </TouchableOpacity>
      </View>
    </PhoneShell>
  );
}
