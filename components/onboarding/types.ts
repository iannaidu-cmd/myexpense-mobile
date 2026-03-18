export interface WorkType {
  label: string;
  icon: string;
}

export interface OnboardingSlide {
  id: number;
  emoji: string;
  headline: string;
  sub: string;
  accent?: string;
  bg?: string[];
  stat?: {
    value: string;
    label: string;
  };
  features?: string[];
  isSetup?: boolean;
}

export interface OnboardingData {
  name: string;
  taxNumber: string;
  workTypeIdx: number | null;
}

export type OnboardingStage = "slides" | "setup" | "done";
