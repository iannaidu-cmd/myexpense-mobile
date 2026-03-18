# Copilot instructions for MyExpense (Expo + expo-router)

Purpose
- Help AI agents make safe, targeted edits in this Expo + `expo-router` React Native app.

Big picture
- Routing: `app/_layout.tsx` defines a `Stack` with an `anchor: '(tabs)'` stack entry. The main UI lives under `app/(tabs)` which uses `Tabs` in `app/(tabs)/_layout.tsx`.
- Theming: app uses a light/dark theme via `useColorScheme` and `useThemeColor` (`hooks/use-theme-color.ts`). Themed primitives are `components/themed-text.tsx` and `components/themed-view.tsx`.
- UI conventions: icons use SF Symbol names and `components/ui/icon-symbol.tsx` maps them to Material Icons on non-iOS platforms. Haptic feedback is provided by `components/haptic-tab.tsx`.
- Animation: `components/parallax-scroll-view.tsx` uses `react-native-reanimated` and `useScrollOffset` for parallax headers.

How to run & common scripts (from `package.json`)
- Start dev server: `npm start` (runs `expo start`).
- Platform quick commands: `npm run android`, `npm run ios`, `npm run web` (all proxy to `expo start` with flags).
- Reset starter app: `npm run reset-project` (runs `scripts/reset-project.js` — use when restoring example `app` folder).
- Lint: `npm run lint` (uses `expo lint`).

Project-specific patterns & guidance
- Folder routing: Files under `app/` map to routes. The special folder name `(tabs)` is used as an anchor; do not rename without updating `unstable_settings` in `app/_layout.tsx`.
- Adding tabs/screens: To add a new tab, add a file in `app/(tabs)/` (e.g. `settings.tsx`) and add a corresponding `Tabs.Screen` entry in `app/(tabs)/_layout.tsx` if a custom icon or title is needed.
- Themed colors: Prefer `useThemeColor({ light, dark }, 'text'|'background')` instead of hard-coded colors; use `ThemedText`/`ThemedView` for consistent styling.
- Icon additions: To use an SF Symbol in `IconSymbol`, add a mapping in `components/ui/icon-symbol.tsx` (keyed by SF symbol name) to an appropriate `MaterialIcons` name.
- Haptics: `components/haptic-tab.tsx` gates iOS behavior by `process.env.EXPO_OS === 'ios'`. When testing haptics on other platforms, expect no-op.
- Animations: Code using `react-native-reanimated` (e.g. `parallax-scroll-view.tsx`) expects `react-native-reanimated` to be installed and configured; avoid refactors that change hook usage without testing on device/emulator.

Integration & dependencies
- Expo SDK: See `package.json` for pinned versions (Expo SDK ~54). Use the matching `expo` CLI and compatible `react-native`.
- Native modules: `expo-haptics`, `expo-image`, `expo-router`, and `react-native-reanimated` are in use — keep these when changing navigation/animation/haptics code.
- Path alias: Code imports use `@/` alias (e.g. `@/components/...`). Maintain `tsconfig.json` paths when moving files.

Examples (copyable)
- Use themed text:
  ```tsx
  <ThemedText type="subtitle">Title</ThemedText>
  ```
- Use theme color helper:
  ```ts
  const bg = useThemeColor({}, 'background');
  ```
- Map a symbol in `IconSymbol`:
  ```ts
  // components/ui/icon-symbol.tsx
  const MAPPING = { 'new.symbol': 'material_icon_name', ... };
  ```

What not to change without verification
- The `app/` routing folder structure, `unstable_settings` anchor, `tsconfig` path aliases, and `package.json` dependency versions — changing these can break routing or build.

If anything is unclear or you want me to expand examples, tell me which area (routing, theming, icons, scripts) and I'll iterate.
