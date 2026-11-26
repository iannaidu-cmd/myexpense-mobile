import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const noSubscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * The server snapshot (false) is used for the static HTML and during hydration;
 * React then re-renders with the client snapshot (true).
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
