import { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { NotificationsCenter } from "@/components/dashboard/notifications-center";
import { GlobalSearch } from "@/components/dashboard/global-search";
import type { DashboardScreen } from "@/components/dashboard/types";

interface DashboardScreensProps {
  currentScreen?: DashboardScreen;
}

/**
 * Dashboard Screens Orchestrator
 * Manages modal screens for:
 * - Period selector (month/year/custom date range)
 * - Notifications center
 * - Global search
 */
export function DashboardScreens({
  currentScreen = "overview",
}: DashboardScreensProps) {
  const [activeScreen, setActiveScreen] =
    useState<DashboardScreen>(currentScreen);

  const closeScreen = () => {
    setActiveScreen("overview");
  };

  return (
    <>
      {/* Period Selector Modal */}
      <Modal
        visible={activeScreen === "period"}
        animationType="slide"
        onRequestClose={closeScreen}
      >
        <PeriodSelector onClose={closeScreen} />
      </Modal>

      {/* Notifications Center Modal */}
      <Modal
        visible={activeScreen === "notifications"}
        animationType="slide"
        onRequestClose={closeScreen}
      >
        <NotificationsCenter onClose={closeScreen} />
      </Modal>

      {/* Global Search Modal */}
      <Modal
        visible={activeScreen === "search"}
        animationType="fade"
        onRequestClose={closeScreen}
      >
        <GlobalSearch onClose={closeScreen} />
      </Modal>

      {/* Overlay to close modals */}
      {activeScreen !== "overview" && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={closeScreen}
          activeOpacity={1}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
});
