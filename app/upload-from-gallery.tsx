import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { colour, typography, space, radius } from '@/tokens';

type GalleryItem = { id: string; uri: string; name: string; size: string; date: string };

const MOCK_IMAGES: GalleryItem[] = [
  { id: '1', uri: '', name: 'Receipt_Jan.jpg',  size: '1.2 MB', date: '15 Jan 2026' },
  { id: '2', uri: '', name: 'Invoice_Feb.jpg',  size: '0.8 MB', date: '03 Feb 2026' },
  { id: '3', uri: '', name: 'Slip_Mar.jpg',     size: '2.1 MB', date: '10 Mar 2026' },
  { id: '4', uri: '', name: 'Receipt_Mar2.jpg', size: '1.5 MB', date: '14 Mar 2026' },
  { id: '5', uri: '', name: 'Fuel_slip.jpg',    size: '0.6 MB', date: '16 Mar 2026' },
  { id: '6', uri: '', name: 'Office_inv.jpg',   size: '1.9 MB', date: '17 Mar 2026' },
];

export default function UploadFromGalleryScreen({ navigation }: any) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState<'recent' | 'all'>('recent');

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleUpload = async () => {
    if (!selected.length) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    navigation?.navigate('ScanReceiptProcessingScreen', { source: 'gallery', count: selected.length });
  };

  const Placeholder = ({ size }: { size: number }) => (
    <View style={{ width: size, height: size, backgroundColor: colour.bgPage, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm }}>
      <Text style={{ fontSize: size * 0.35 }}>🖼️</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space['3xl'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
          <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: colour.textOnPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
          </TouchableOpacity>
          <Text style={[typography.labelM, { color: 'rgba(255,255,255,0.85)' }]}>Upload Receipt</Text>
          <TouchableOpacity onPress={() => {/* TODO: open native picker */}}>
            <Text style={[typography.labelM, { color: colour.textOnPrimary }]}>Browse</Text>
          </TouchableOpacity>
        </View>
        <Text style={[typography.heading3, { color: colour.textOnPrimary }]}>Select from Gallery</Text>
        <Text style={[typography.bodyS, { color: 'rgba(255,255,255,0.7)', marginTop: 2 }]}>
          {selected.length > 0 ? `${selected.length} selected` : 'Tap images to select'}
        </Text>
      </View>

      {/* Card */}
      <View style={{ flex: 1, backgroundColor: colour.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -2 }}>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, paddingTop: space.lg, marginBottom: space.md, gap: space.sm }}>
          {(['recent', 'all'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={{ flex: 1, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === t ? colour.primary : 'transparent', borderWidth: 1.5, borderColor: tab === t ? colour.primary : colour.border }}>
              <Text style={[typography.btnM, { color: tab === t ? colour.textOnPrimary : colour.textSecondary }]}>
                {t === 'recent' ? 'Recent' : 'All Photos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 100 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {MOCK_IMAGES.map(img => {
              const isSelected = selected.includes(img.id);
              const itemSize = (340 - space.lg * 2 - space.sm * 2) / 3;
              return (
                <TouchableOpacity key={img.id} onPress={() => toggle(img.id)}
                  style={{ width: itemSize, borderRadius: radius.sm, overflow: 'hidden', borderWidth: 2, borderColor: isSelected ? colour.primary : 'transparent' }}>
                  <Placeholder size={itemSize} />
                  {isSelected && (
                    <View style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: colour.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colour.textOnPrimary, fontSize: 12, fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                  <View style={{ padding: 4 }}>
                    <Text style={[typography.micro, { color: colour.textSecondary }]} numberOfLines={1}>{img.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tips */}
          <View style={{ backgroundColor: colour.primaryLight, borderRadius: radius.md, padding: space.md, marginTop: space.xl }}>
            <Text style={[typography.labelS, { color: colour.primary, marginBottom: space.xs }]}>📋 Tips for best results</Text>
            <Text style={[typography.bodyS, { color: colour.primary }]}>• Ensure the receipt is fully visible and well-lit{'\n'}• Avoid blurry or dark images{'\n'}• JPEG and PNG formats are supported</Text>
          </View>
        </ScrollView>

        {/* Bottom action */}
        {selected.length > 0 && (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colour.bgCard, padding: space.lg, borderTopWidth: 1, borderTopColor: colour.border }}>
            <TouchableOpacity onPress={handleUpload} disabled={loading}
              style={{ backgroundColor: colour.primary, borderRadius: radius.pill, height: 52, alignItems: 'center', justifyContent: 'center' }}>
              {loading
                ? <ActivityIndicator color={colour.textOnPrimary} />
                : <Text style={[typography.btnL, { color: colour.textOnPrimary }]}>Upload {selected.length} Receipt{selected.length > 1 ? 's' : ''}</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
