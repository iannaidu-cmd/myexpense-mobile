import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colour } from "@/tokens";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ScanStageProps {
  pulseRing: boolean;
  onCapture: () => void;
}

const RECENT_SCANS = [
  { vendor: "Takealot", amount: "R 399", date: "Yesterday", icon: "💻" },
  { vendor: "Uber", amount: "R 185", date: "10 Mar", icon: "🚗" },
  { vendor: "Spur", amount: "R 542", date: "8 Mar", icon: "🍽️" },
];

export function ScanStageComponent({ pulseRing, onCapture }: ScanStageProps) {
  return (
    <>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Scan Receipt
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Point your camera at a receipt to auto-capture
        </ThemedText>
      </ThemedView>

      {/* Camera Viewfinder */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinder}>
          {/* Corner guides */}
          {[
            { top: 24, left: 24, borderTop: 3, borderLeft: 3 },
            { top: 24, right: 24, borderTop: 3, borderRight: 3 },
            { bottom: 24, left: 24, borderBottom: 3, borderLeft: 3 },
            { bottom: 24, right: 24, borderBottom: 3, borderRight: 3 },
          ].map((_, i) => (
            <View key={i} style={[styles.corner, _]} />
          ))}

          {/* Receipt frame hint */}
          <View style={styles.receiptFrame} />

          {/* Pulse rings and button */}
          <View style={styles.pulseContainer}>
            <View
              style={[
                styles.pulseRing,
                {
                  width: pulseRing ? 90 : 70,
                  height: pulseRing ? 90 : 70,
                  opacity: pulseRing ? 0.3 : 0.15,
                },
              ]}
            />
            <View
              style={[
                styles.pulseRing2,
                {
                  width: pulseRing ? 120 : 90,
                  height: pulseRing ? 120 : 90,
                  opacity: pulseRing ? 0.2 : 0.08,
                },
              ]}
            />
            <View style={styles.shutterCircle}>
              <ThemedText style={styles.shutterIcon}>📄</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.alignHint}>
            Align receipt within frame
          </ThemedText>
        </View>
      </View>

      {/* Capture Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={onCapture}
          accessibilityRole="button"
          accessibilityLabel="Capture receipt photo"
        >
          <ThemedText style={styles.cameraIcon}>📸</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Or Upload */}
      <View style={styles.uploadSection}>
        <ThemedText style={styles.orText}>— or —</ThemedText>
        <TouchableOpacity
          style={styles.uploadButton}
          accessibilityRole="button"
          accessibilityLabel="Upload receipt from gallery"
        >
          <ThemedText style={styles.uploadText}>
            📁 Upload from Gallery
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Recent Scans */}
      <View style={styles.recentSection}>
        <ThemedText type="defaultSemiBold" style={styles.recentTitle}>
          Recent Scans
        </ThemedText>
        {RECENT_SCANS.map((scan, i) => (
          <View key={i} style={styles.recentItem}>
            <ThemedText style={styles.recentIcon}>{scan.icon}</ThemedText>
            <View style={styles.recentInfo}>
              <ThemedText type="defaultSemiBold">{scan.vendor}</ThemedText>
              <ThemedText style={styles.recentDate}>{scan.date}</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={styles.recentAmount}>
              {scan.amount}
            </ThemedText>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  viewfinderContainer: {
    paddingHorizontal: 24,
  },
  viewfinder: {
    backgroundColor: colour.noir,
    borderRadius: 24,
    height: 300,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: colour.primary,
  },
  receiptFrame: {
    position: "absolute",
    top: 40,
    left: 50,
    right: 50,
    bottom: 40,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: `${colour.primary}40`,
    borderRadius: 8,
  },
  pulseContainer: {
    position: "relative",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: `${colour.primary}4D`,
  },
  pulseRing2: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colour.primary}26`,
  },
  shutterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colour.primary}26`,
    borderWidth: 2,
    borderColor: `${colour.primary}80`,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  shutterIcon: {
    fontSize: 28,
  },
  alignHint: {
    position: "absolute",
    bottom: 16,
    color: `${colour.primary}B3`,
    fontSize: 12,
  },
  buttonContainer: {
    alignItems: "center",
    paddingVertical: 28,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colour.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colour.white,
  },
  cameraIcon: {
    fontSize: 28,
  },
  uploadSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  orText: {
    color: colour.textHint,
    fontSize: 12,
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: colour.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: colour.border,
  },
  uploadText: {
    color: colour.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recentTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  recentIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentDate: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 13,
    fontWeight: "700",
  },
});
