import NetInfo from "@react-native-community/netinfo";

/** Returns true if the device has an active internet connection. */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}
