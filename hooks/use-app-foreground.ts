import { useEffect, useRef } from "react";
import { AppState } from "react-native";

/**
 * Calls `onForeground` whenever the app transitions from background/inactive
 * back to the active state. Safe to call with an inline arrow — the latest
 * callback is always used without re-subscribing.
 */
export function useAppForeground(onForeground: () => void) {
  const callbackRef = useRef(onForeground);
  callbackRef.current = onForeground;

  useEffect(() => {
    const appStateRef = { current: AppState.currentState };
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        callbackRef.current();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);
}
