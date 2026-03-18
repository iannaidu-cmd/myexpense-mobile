# Onboarding Refactoring

## Overview

Refactored the monolithic `Onboarding.js` (800 lines, JavaScript) into a modular TypeScript architecture with 5 focused components, a clear separation of concerns, and improved type safety.

## Architecture

### File Structure

```
app/onboarding.tsx (main orchestrator, 150 lines)
components/onboarding/
  ├── types.ts (interface definitions)
  ├── shell.tsx (iPhone frame wrapper)
  ├── slides-carousel.tsx (onboarding slides)
  ├── setup-form.tsx (setup information form)
  └── success-screen.tsx (completion screen)
```

### State Management

The main orchestrator (`app/onboarding.tsx`) manages:

- **stage**: `'slides' | 'setup' | 'done'` — current onboarding step
- **slideIdx**: current slide index (0-2) within carousel
- **animatingIn**: controls slide entry animation
- **orbPulsing**: controls decorative orb pulse effect
- **formData**: user-entered name, tax number, work type selection

### Data Flow

1. **Slides Stage** → User views 3 onboarding slides, can skip to setup
2. **Setup Stage** → User enters name, tax number, selects work type
3. **Done Stage** → Success confirmation, option to go to dashboard

## Components

### `shell.tsx`

iPhone device frame wrapper with status bar mockup using React Native `View` and `StyleSheet`.

- **Props**: `children` (ReactNode)
- **Purpose**: Provides visual device context for onboarding UI
- **Style**: Black background, 18px notch padding, SafeArea approximation

### `slides-carousel.tsx`

Animated carousel of 3 onboarding slides with navigation controls.

- **Props**:
  - `slides`: array of `OnboardingSlide` objects (emoji, headline, features, etc.)
  - `currentSlideIdx`: current slide index
  - `animatingIn`: opacity/scale animation flag
  - `orbPulsing`: decorative pulse effect flag
  - Callbacks: `onSlideNext`, `onSlidePrev`, `onSkip`
  - `logoUri`: base64 app logo
- **Features**:
  - Emoji orbs with pulse effect
  - Stat pill on slide 1
  - Feature list on slides 2–3
  - Indicator dots (iOS style)
  - Previous/Next buttons
  - "Skip" button to jump to setup

### `setup-form.tsx`

Form for collecting user information (name, tax number, work type).

- **Props**:
  - `data`: `OnboardingData` (name, taxNumber, workTypeIdx)
  - `workTypes`: array of work type options
  - `onChange`: callback for form updates
  - `onContinue`: callback when form is submitted
  - `logoUri`: base64 app logo
- **Features**:
  - Name input field
  - Tax number input field
  - 2-column work type grid selector
  - Form validation (name and work type required)
  - "Continue" button (disabled until valid)
  - Scroll inside Shell

### `success-screen.tsx`

Confirmation screen displayed after setup form submission.

- **Props**:
  - `data`: `OnboardingData` (user's entered info)
  - `workTypes`: work type array for label lookup
  - `onComplete`: callback when going to dashboard
- **Features**:
  - Large checkmark icon (success circle)
  - Welcome message with user's name
  - Summary card (work type, tax number)
  - "Go to Dashboard" button
  - Centered, scrollable layout

### `types.ts`

TypeScript interfaces for type safety across all components:

```typescript
type WorkType = {
  label: string;
  icon: string;
};

type OnboardingSlide = {
  id: number;
  emoji: string;
  headline: string;
  sub: string;
  accent: string;
  bg: [string, string];
  stat?: { value: string; label: string };
  features?: string[];
};

type OnboardingData = {
  name: string;
  taxNumber: string;
  workTypeIdx: number | null;
};

type OnboardingStage = "slides" | "setup" | "done";
```

## Key Changes from Original

### Before (`Onboarding.js`)

- 800 lines in single file
- Inline styles mixed with logic
- No TypeScript types
- State management scattered
- No component extraction
- Heavy use of imperative rendering logic

### After (Modular)

- **Main orchestrator**: 150 lines (pure state & callbacks)
- **Sub-components**: 4 focused components (~380, ~230, ~140 lines each)
- **Types file**: all interfaces in one place
- **Type safety**: full TypeScript coverage
- **Testability**: each component isolated with clear props contract
- **Reusability**: Shell wrapper can be used for other full-screen flows

## Integration with Project

### Routing

Currently placed at `app/onboarding.tsx` (not in `(tabs)` group). Typical flow:

- App navigates to onboarding on first launch
- After completion, updates auth state and navigates to dashboard
- Can also be accessed from settings as "Redo Onboarding"

### Theming

Uses React Native `StyleSheet` for styling; integrates with project's light/dark theme:

- `useThemeColor` can be added if dark mode support is needed
- Currently uses hardcoded gradient backgrounds (intentional brand colors)
- Text uses default theme colors

### Assets

- Logo: embedded as base64 data URI (passed via props)
- Icons: emoji strings (no dependencies)
- No external image files required

## Testing Recommendations

1. **Stage Transitions**: Verify each stage change (slides→setup, setup→done)
2. **Form Validation**: Ensure setup form blocks continue until name + work type selected
3. **Animation Timing**: Check slide carousel animations play smoothly
4. **Device Frame**: Verify Shell component renders correctly on different screen sizes
5. **Data Persistence**: After completion, confirm user data is saved to app state/storage

## Future Improvements

1. **Animations**: Add `react-native-reanimated` for smooth shared element transitions
2. **Storage**: Integrate Redux/Context to persist onboarding state
3. **Analytics**: Track which slides users spend most time on
4. **Accessibility**: Add `testID` to all interactive elements for test automation
5. **Dark Mode**: Apply project's dark theme system to gradients and text
6. **Validation**: Add real tax number format validation for South African context
