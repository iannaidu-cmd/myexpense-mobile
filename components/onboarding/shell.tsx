import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <View style={styles.container}>
      <View style={styles.deviceFrame}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.time}>9:41</Text>
          <View style={styles.statusIcons}>
            <View style={styles.signalDots} />
            <Text style={styles.statusText}>📶</Text>
            <Text style={styles.statusText}>🔋</Text>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  deviceFrame: {
    width: 375,
    height: 812,
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
    borderWidth: 10,
    borderColor: "#0D47A1",
    flexDirection: "column",
  },
  statusBar: {
    backgroundColor: "#0D47A1",
    paddingVertical: 10,
    paddingHorizontal: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statusIcons: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  signalDots: {
    width: 0,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
  },
});
