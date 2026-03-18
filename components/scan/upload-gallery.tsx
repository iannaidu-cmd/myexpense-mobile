import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { colour } from "@/tokens";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

interface Photo {
  id: number;
  emoji: string;
  label: string;
  date: string;
  hasReceipt: boolean;
}

interface ReceiptData {
  label: string;
  value: string;
  highlight?: boolean;
}

type Stage = "browse" | "preview" | "processing" | "done";

const MOCK_PHOTOS: Photo[] = [
  { id: 1, emoji: "🧾", label: "IMG_4821", date: "Today", hasReceipt: true },
  { id: 2, emoji: "🌅", label: "IMG_4820", date: "Today", hasReceipt: false },
  {
    id: 3,
    emoji: "📄",
    label: "IMG_4815",
    date: "Yesterday",
    hasReceipt: true,
  },
  {
    id: 4,
    emoji: "🏢",
    label: "IMG_4810",
    date: "Yesterday",
    hasReceipt: false,
  },
  { id: 5, emoji: "🧾", label: "IMG_4798", date: "Mon", hasReceipt: true },
  { id: 6, emoji: "📸", label: "IMG_4790", date: "Mon", hasReceipt: false },
  { id: 7, emoji: "📃", label: "IMG_4782", date: "Sun", hasReceipt: true },
  { id: 8, emoji: "🌿", label: "IMG_4780", date: "Sun", hasReceipt: false },
  { id: 9, emoji: "🧾", label: "IMG_4770", date: "Sat", hasReceipt: true },
];

export function UploadGalleryScreen() {
  const [selected, setSelected] = useState<Photo | null>(null);
  const [stage, setStage] = useState<Stage>("browse");
  const [filter, setFilter] = useState("all");
  const [progress, setProgress] = useState(0);

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#121212" },
    "background",
  );
  const cardBackground = useThemeColor(
    { light: colour.surface1, dark: "#1E1E1E" },
    "background",
  );
  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor(
    { light: colour.textHint, dark: "#9E9E9E" },
    "text",
  );
  const borderColor = useThemeColor(
    { light: colour.border, dark: "#424242" },
    "text",
  );
  const accentColor = colour.primary;
  const accentDark = colour.primary;

  const filtered =
    filter === "receipts"
      ? MOCK_PHOTOS.filter((p) => p.hasReceipt)
      : MOCK_PHOTOS;

  const handleSelect = (photo: Photo) => {
    setSelected(photo);
    setStage("preview");
  };

  const handleProcess = () => {
    setStage("processing");
    let p = 0;
    const t = setInterval(() => {
      p += 3;
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => setStage("done"), 400);
      }
    }, 40);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 24,
      backgroundColor: colour.primary,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colour.onPrimary,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.55)",
    },
    content: {
      flex: 1,
      overflow: "scroll",
      padding: 16,
    },
    filterContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    filterPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 100,
      borderWidth: 1.5,
    },
    filterPillActive: {
      backgroundColor: colour.primary,
      borderColor: colour.primary,
    },
    filterPillInactive: {
      backgroundColor: colour.white,
      borderColor: borderColor,
    },
    filterText: {
      fontSize: 12,
      fontWeight: "600",
    },
    dropZone: {
      backgroundColor: colour.primary50,
      borderRadius: 18,
      padding: 20,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: borderColor,
      marginBottom: 20,
      alignItems: "center",
    },
    dropZoneEmoji: {
      fontSize: 32,
      marginBottom: 8,
    },
    dropZoneText: {
      fontSize: 13,
      fontWeight: "600",
      color: colour.primary,
      marginBottom: 4,
    },
    dropZoneSubtext: {
      fontSize: 11,
      color: mutedColor,
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    photoItem: {
      width: "31%",
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 2,
    },
    photoImageContainer: {
      height: 90,
      backgroundColor: "#E0E2F8",
      alignItems: "center",
      justifyContent: "center",
    },
    photoEmoji: {
      fontSize: 36,
    },
    photoLabel: {
      backgroundColor: colour.white,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    receiptBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      backgroundColor: accentColor,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
      zIndex: 1,
    },
    badgeText: {
      fontSize: 8,
      fontWeight: "700",
      color: colour.onPrimary,
    },
    successContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      paddingHorizontal: 28,
    },
    successIcon: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colour.text,
      marginBottom: 8,
    },
    successMessage: {
      fontSize: 13,
      color: colour.textSub,
      marginBottom: 32,
      lineHeight: 1.6,
      textAlign: "center",
    },
  });

  // Done Stage
  if (stage === "done") {
    const receiptData: ReceiptData[] = [
      { label: "Vendor", value: "Checkers Hyper" },
      { label: "Amount", value: "R 1,842.50" },
      { label: "Date", value: "12 Mar 2026" },
      { label: "ITR12 Category", value: "🏠 Home Office", highlight: true },
      { label: "Confidence", value: "91%" },
    ];

    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.successContainer}>
          <View style={styles.successIcon}>
            <ThemedText style={{ fontSize: 44 }}>✓</ThemedText>
          </View>
          <ThemedText style={styles.successTitle}>Image Uploaded!</ThemedText>
          <ThemedText style={styles.successMessage}>
            OCR extraction complete.{"\n"}Review the extracted details below.
          </ThemedText>

          <View
            style={[
              styles.content,
              {
                backgroundColor: "rgba(255, 255, 255, 0.10)",
                borderRadius: 20,
                padding: 18,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.15)",
              },
            ]}
          >
            {receiptData.map((r, i) => (
              <View
                key={i}
                style={{
                  paddingVertical: 9,
                  borderBottomWidth: i < 4 ? 1 : 0,
                  borderBottomColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <ThemedText
                    style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.45)" }}
                  >
                    {r.label}
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: r.highlight ? accentColor : colour.onPrimary,
                    }}
                  >
                    {r.value}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => setStage("browse")}
            style={[
              styles.content,
              {
                backgroundColor: accentColor,
                borderRadius: 18,
                paddingVertical: 15,
                marginBottom: 12,
              },
            ]}
          >
            <ThemedText
              style={{
                fontWeight: "800",
                fontSize: 15,
                color: colour.onPrimary,
                textAlign: "center",
              }}
            >
              ✓ Review & Save Expense
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => setStage("browse")}>
            <ThemedText
              style={{ fontSize: 13, fontWeight: "600", color: accentColor }}
            >
              Upload Another →
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  }

  // Processing Stage
  if (stage === "processing") {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.successContainer}>
          <View
            style={{
              width: 120,
              height: 150,
              backgroundColor: colour.white,
              borderRadius: 14,
              marginBottom: 36,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <ThemedText style={{ fontSize: 52 }}>{selected?.emoji}</ThemedText>
            <View
              style={{
                position: "absolute",
                top: progress * 1.5,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: accentColor,
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: progress * 1.5,
                backgroundColor: "rgba(59, 191, 173, 0.07)",
              }}
            />
          </View>

          <ThemedText
            style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}
          >
            Extracting Data...
          </ThemedText>
          <ThemedText
            style={{ fontSize: 13, color: mutedColor, marginBottom: 28 }}
          >
            Running OCR on your image
          </ThemedText>

          <View
            style={{
              width: "100%",
              backgroundColor: borderColor,
              borderRadius: 100,
              height: 8,
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: accentColor,
                borderRadius: 100,
              }}
            />
          </View>

          <ThemedText
            style={{
              color: accentColor,
              fontWeight: "700",
              fontSize: 14,
              marginBottom: 28,
            }}
          >
            {progress}%
          </ThemedText>

          {[
            ["Enhancing image", 0],
            ["Detecting text regions", 33],
            ["Extracting amounts", 66],
          ].map(([stepText, threshold], i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: i === 0 ? 28 : 8,
                opacity: progress > (threshold as number) ? 1 : 0.3,
                width: "100%",
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor:
                    progress > (threshold as number) + 30
                      ? accentColor
                      : borderColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colour.onPrimary,
                  }}
                >
                  {progress > (threshold as number) + 30 ? "✓" : i + 1}
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: 13, fontWeight: "500" }}>
                {stepText}
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      </ThemedView>
    );
  }

  // Preview Stage
  if (stage === "preview") {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <Pressable
            onPress={() => setStage("browse")}
            style={{ marginBottom: 16 }}
          >
            <ThemedText
              style={{ fontSize: 22, color: "rgba(255, 255, 255, 0.65)" }}
            >
              ←
            </ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Review Image</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Confirm before OCR processing
          </ThemedText>
        </ThemedView>

        <ScrollView style={styles.content}>
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "100%",
                height: 200,
                backgroundColor: "#E0E2F8",
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <ThemedText style={{ fontSize: 72 }}>
                {selected?.emoji}
              </ThemedText>
            </View>
            <ThemedText
              style={{ fontSize: 15, fontWeight: "700", color: textColor }}
            >
              {selected?.label}.jpg
            </ThemedText>
            <ThemedText
              style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}
            >
              Taken {selected?.date} · 2.4 MB
            </ThemedText>
          </View>

          {selected?.hasReceipt && (
            <View
              style={{
                backgroundColor: "rgba(59, 191, 173, 0.1)",
                borderRadius: 16,
                padding: 14,
                flexDirection: "row",
                gap: 14,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: "rgba(59, 191, 173, 0.3)",
              }}
            >
              <ThemedText style={{ fontSize: 26 }}>🧾</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colour.success,
                    marginBottom: 2,
                  }}
                >
                  Receipt Detected
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: accentColor }}>
                  This image appears to contain a receipt
                </ThemedText>
              </View>
            </View>
          )}

          <View
            style={{
              backgroundColor: cardBackground,
              borderRadius: 16,
              padding: 14,
              marginBottom: 20,
              borderWidth: 1.5,
              borderColor: borderColor,
            }}
          >
            <ThemedText
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: textColor,
                marginBottom: 10,
              }}
            >
              OCR will extract:
            </ThemedText>
            {[
              "Vendor / supplier name",
              "Total amount & VAT",
              "Transaction date",
              "ITR12 category suggestion",
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: `${accentColor}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: accentColor,
                    }}
                  />
                </View>
                <ThemedText style={{ fontSize: 13 }}>{item}</ThemedText>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleProcess}
            style={{
              backgroundColor: accentColor,
              borderRadius: 18,
              padding: 16,
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <ThemedText
              style={{
                fontWeight: "700",
                fontSize: 15,
                color: colour.onPrimary,
              }}
            >
              🔍 Extract Receipt Data
            </ThemedText>
          </Pressable>

          <ThemedText
            style={{ textAlign: "center", color: mutedColor, fontSize: 12 }}
          >
            ← Choose a different image
          </ThemedText>
        </ScrollView>
      </ThemedView>
    );
  }

  // Browse Stage (default)
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <Pressable style={{ marginBottom: 16 }}>
          <ThemedText
            style={{ fontSize: 22, color: "rgba(255, 255, 255, 0.65)" }}
          >
            ←
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>Upload from Gallery</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Select a receipt image to scan
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* Filter pills */}
        <View style={styles.filterContainer}>
          {[
            { value: "all", label: "All Photos" },
            { value: "receipts", label: "📄 Receipts Only" },
          ].map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[
                styles.filterPill,
                filter === value
                  ? styles.filterPillActive
                  : styles.filterPillInactive,
              ]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  { color: filter === value ? colour.onPrimary : mutedColor },
                ]}
              >
                {label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Drag & drop zone */}
        <Pressable style={styles.dropZone}>
          <ThemedText style={styles.dropZoneEmoji}>📁</ThemedText>
          <ThemedText style={styles.dropZoneText}>
            Tap to browse files
          </ThemedText>
          <ThemedText style={styles.dropZoneSubtext}>
            JPG, PNG, PDF supported
          </ThemedText>
        </Pressable>

        {/* Recent photos label */}
        <ThemedText
          type="subtitle"
          style={{
            marginBottom: 12,
          }}
        >
          Recent Photos
        </ThemedText>

        {/* Photo grid */}
        <View style={styles.photoGrid}>
          {filtered.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => handleSelect(photo)}
              style={[
                styles.photoItem,
                {
                  borderColor: photo.hasReceipt
                    ? `${accentColor}60`
                    : "transparent",
                },
              ]}
            >
              {photo.hasReceipt && (
                <View style={styles.receiptBadge}>
                  <ThemedText style={styles.badgeText}>REC</ThemedText>
                </View>
              )}
              <View style={styles.photoImageContainer}>
                <ThemedText style={styles.photoEmoji}>{photo.emoji}</ThemedText>
              </View>
              <View style={styles.photoLabel}>
                <ThemedText
                  numberOfLines={1}
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: textColor,
                  }}
                >
                  {photo.label}
                </ThemedText>
                <ThemedText style={{ fontSize: 9, color: mutedColor }}>
                  {photo.date}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
