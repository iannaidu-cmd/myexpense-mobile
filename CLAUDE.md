# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
expo start              # Start dev server (Expo Go / dev client)
expo start --android    # Launch on Android
expo start --ios        # Launch on iOS
expo lint               # Run ESLint (expo flat config)
```

No test runner is configured in this project.

## What this app is

MyExpense is a South African freelancer/self-employed expense tracker. Core features: receipt OCR scanning, manual expense entry, mileage tracking (GPS), income logging, VAT summary, and ITR12 tax export (PDF/CSV). Monetised via RevenueCat subscriptions with a `is_dev_user` flag in the `profiles` table to bypass paywalls in development.

## Architecture

### Routing — Expo Router (file-based)

```
app/
  _layout.tsx          ← root Stack + auth gate + Sentry/RevenueCat init
  (tabs)/
    _layout.tsx        ← tab bar: Home, Add Expense, Reports, Scan, Settings
    index.tsx          ← dashboard
    add-expense.tsx
    reports.tsx
    scan.tsx           ← camera / OCR
    settings.tsx
  sign-in / sign-up / forgot-password / reset-password / email-verification
  onboarding-step-1/2/3
  auth/callback.tsx    ← OAuth deep-link return (myexpense://reset-password)
```

Auth gate lives in `app/_layout.tsx`: unauthenticated → onboarding; authenticated users hitting auth screens → tabs; legal screens always accessible.

### State — Zustand stores (`/stores`)

| Store | Responsibility |
|---|---|
| `authStore.ts` | Session, onboarding status, premium flag |
| `expenseStore.ts` | Active tax-year expenses, recent list, totals |
| `subscriptionStore.ts` | RevenueCat subscription state |
| `taxStore.ts` | Active tax year + tax settings |

Always read/write state via store actions, never call Supabase directly from screens.

### Data layer — `/services`

All Supabase queries are encapsulated in services. Screens call stores → stores call services → services call Supabase.

Key services: `expenseService`, `incomeService`, `taxService`, `pdfExportService`, `csvExportService`, `biometricService`, `notificationService`, `googleAuthService`, `profileService`.

Supabase client is initialised once in `/lib/supabase.ts` (AsyncStorage persistence on native, session detection on web).

Key tables: `profiles`, `expenses`, `income`, `receipts`, `mileage_trips`.

### Validation — `/lib/validation.ts`

Centralised validation for all user inputs. Max expense amount is 9,999,999.99 (SARS compliance ceiling). Use this file for any new field validation.

## TypeScript path aliases

```
@/*           → project root
@/lib/*       → /lib
@/types/*     → /types
@/services/*  → /services
@/stores/*    → /stores
@/components/*→ /components
@/tokens/*    → /tokens
```

## Design system

Design tokens live in `/tokens` (exported as `colour`). Material Design palette in `/constants/design-system.ts`. Primary periwinkle: `#6B6AD8`. Always use token/constant references — no hard-coded hex values in components.

Themed components: `ThemedText`, `ThemedView`. Custom MX component library: `MXButton`, `MXInput`, `MXCard`, `MXHeader`, `MXBadge`, `MXScreenHeader`, `MXShell`, `MXTabBar`. Use these over bare RN primitives.

Icons use SF Symbols on iOS mapped to Material Icons on Android via `components/ui/icon-symbol.tsx`.

Haptics are iOS-gated via `HapticTab`.

## Environment variables

Stored in `.env` (never committed). All are `EXPO_PUBLIC_` prefixed:

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_REVENUECAT_IOS_KEY
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
EXPO_PUBLIC_SENTRY_DSN
```

## Key runtime setup (app/_layout.tsx)

On startup: Sentry initialised → RevenueCat configured per platform → push notification permissions requested → auth session restored from AsyncStorage. React Compiler and New Architecture (`newArchEnabled: true`) are both enabled. Metro is wrapped by Sentry's config in `metro.config.js`.

## Supabase / backend notes

- Deep-link scheme: `myexpense://` — used for OAuth callback and password reset.
- Location permissions (expo-location) are required for mileage tracking; SARS compliance copy is set in `app.json`.
- Migrations live in `/supabase/migrations`.
