import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = "https://hhfbbbxgmovfpaziebsw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZmJiYnhnbW92ZnBhemllYnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODA2NTAsImV4cCI6MjA4NzE1NjY1MH0.Z2frUvYeIl7aJGsn4LG5Pm1UocBIKnx7ld80uiEGzRc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== "web" ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: Platform.OS !== "web",
    detectSessionInUrl: Platform.OS === "web",
  },
});
