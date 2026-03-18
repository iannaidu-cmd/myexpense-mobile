import { SetupForm } from "@/components/onboarding/setup-form";
import { Shell } from "@/components/onboarding/shell";
import { SlidesCarousel } from "@/components/onboarding/slides-carousel";
import { SuccessScreen } from "@/components/onboarding/success-screen";
import type {
    OnboardingData,
    OnboardingSlide,
    OnboardingStage,
    WorkType,
} from "@/components/onboarding/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

const FULL_LOGO =
  "data:image/gif;base64,R0lGODlhuwUNAff/APX1+PP7+2VijeLh6tPS3iyp4dbV4UlFeLWzyFK91fj4+pWTsS+t1k645DYya5nc2jW3vTGwz2nC6DCv08Tn9nVymeXl7FVRgVvHwze5tzKyyvz8/W1qk8LA0piWsy2q3pbW6jG5sT05cDS1wjKxzKTb7kRBdeL19ExIe0vBvS6s2bGwxjg0bMbF1YzY1e7u8jm6ti2q3Ta8siOm3d3089va5EE9c3t5nsrJ2FBMfXjRzGPKxfDw9Da4uqqpwNzc5SUhXu/5+yyxxMrs687N28bs6ff8/TMvaKalvmlmkF1aiLji9Cy4rouIqZCOrXBtllPEv4B+oX97oISCpejo7qCfubq5zC63snh1m6bh3lhVhC6r22FeirLl4y8tZiOm4P7//+rq8OP0+h0YWJyatoLN6r/p5769z0K/uC2vzDOzxzWt4aKgupqYtKzi4S+5sC20u93x+aWjvM7r9lpXha2sw+r3+6yqwvT09/v7/IzR6yar0o+NrHZzmrCuxfv+/imo4Vy+4iAcWymo3DOu2je6tzS0xIaEpry7zpORr4yKqian3PLy9qmnv9Lw7ja8sTS4tXXK4LDg8Li3y33R0zC3tTs3biyp3zO0xZ/e3DG4szC6rzO6sj6x4rnn5Sms0J3X77rl7OPi6iWo2DS4tiiq14KAo9Xw8ev4+D27u9jX4uTk6y2u08PC06+txIiGpzO7sIOBpJ+duC6q3cvK2Sus1YmHqCklYS6q3tDv7W3Oxki33TS6szG0web39jO5tC2ywCYiXza7s/Ly9Te6tTa7sja7tEdEd+/v9De6tDe7tP39/fr6++3t8uzr8fPz9nNxmDe7s9/e53Jwl9DP3J6ctygkYd/f6PDv9MnI17++0Ofm7cjH1uzs8dnY48/O3MC/0SgkYN3c5d7d5yomYS0pZDe7tTa6tTW8sSen4Da6tCao3ykmYTW5tPf3+TG7sDqy1iCk30a5z+Dg6IDUz1JPf42Lqzu9tTS5sScjYColYSolYja6sze7sjEtZ////yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgMTAuMC1jMDAwIDc5LmQwNGNjMTY5OCwgMjAyNS8wNy8wMi0xMjoxODoxMyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI3LjMgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkEzRkM2QUNEMEIxOTExRjFCOTE1RjFFNTc0QTBCNzVBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkEzRkM2QUNFMEIxOTExRjFCOTE1RjFFNTc0QTBCNzVBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QTNGQzZBQ0IwQjE5MTFGMUI5MTVGMUU1NzRBMEI3NUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QTNGQzZBQ0MwQjE5MTFGMUI5MTVGMUU1NzRBMEI3NUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQBAAD/ACwAAAAAuwUNAQAI/wD/CRxIsKDBgwIV+FvIsKHDhxAd2liGsKLFixgzatzIUaCBiCBDPuTSsaTJkyhTqlzJ8qDIlzBjypxJU+Swljhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp0TD";

const SLIDES: OnboardingSlide[] = [
  {
    id: 0,
    emoji: "🧾",
    headline: "Stop losing money\nat tax time.",
    sub: "South Africa's self-employed lose thousands in unclaimed deductions every year. MyExpense fixes that.",
    accent: "#0288D1",
    bg: ["#0D47A1", "#1565C0"],
    stat: { value: "R28,400", label: "avg unclaimed per freelancer / year" },
  },
  {
    id: 1,
    emoji: "📸",
    headline: "Scan once.\nForgot nothing.",
    sub: "Point your camera at any receipt — MyExpense reads it, categorises it, and maps it to your ITR12 automatically.",
    accent: "#0288D1",
    bg: ["#1565C0", "#1976D2"],
    features: [
      "OCR receipt scanning",
      "Auto ITR12 categorisation",
      "VAT extraction",
    ],
  },
  {
    id: 2,
    emoji: "📊",
    headline: "Export-ready\nfor SARS.",
    sub: "Generate a complete, SARS-compliant ITR12 expense report at any time — no accountant needed for day-to-day.",
    accent: "#0288D1",
    bg: ["#0D47A1", "#1565C0"],
    features: [
      "ITR12 / ITR13 export",
      "Section 11(a) compliance",
      "One-tap PDF report",
    ],
  },
];

const WORK_TYPES: WorkType[] = [
  { label: "Freelancer", icon: "💻" },
  { label: "Sole Proprietor", icon: "🏪" },
  { label: "Independent Contractor", icon: "📋" },
  { label: "Creative Professional", icon: "🎨" },
  { label: "Consultant", icon: "💼" },
  { label: "Other", icon: "📦" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<OnboardingStage>("slides");
  const [slideIdx, setSlideIdx] = useState(0);
  const [animatingIn, setAnimatingIn] = useState(true);
  const [orbPulsing, setOrbPulsing] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    taxNumber: "",
    workTypeIdx: null,
  });

  // Pulse animation for orbs
  useEffect(() => {
    const timer = setInterval(() => setOrbPulsing((p) => !p), 2000);
    return () => clearInterval(timer);
  }, []);

  const handleSlideNext = () => {
    setAnimatingIn(false);
    setTimeout(() => {
      if (slideIdx < 2) {
        setSlideIdx(slideIdx + 1);
      } else {
        setStage("setup");
      }
      setAnimatingIn(true);
    }, 180);
  };

  const handleSlidePrev = () => {
    if (slideIdx === 0) return;
    setAnimatingIn(false);
    setTimeout(() => {
      setSlideIdx(slideIdx - 1);
      setAnimatingIn(true);
    }, 180);
  };

  const handleSkip = () => {
    setStage("setup");
  };

  const handleFormChange = (updates: Partial<OnboardingData>) => {
    setFormData({ ...formData, ...updates });
  };

  const handleContinueSetup = () => {
    setStage("done");
  };

  const handleComplete = () => {
    // TODO: Save onboarding data to app state/storage
    // Navigate to dashboard
    router.replace("/");
  };

  return (
    <Shell>
      {stage === "slides" && (
        <SlidesCarousel
          slides={SLIDES}
          currentSlideIdx={slideIdx}
          animatingIn={animatingIn}
          orbPulsing={orbPulsing}
          onSlideNext={handleSlideNext}
          onSlidePrev={handleSlidePrev}
          onSkip={handleSkip}
          logoUri={FULL_LOGO}
        />
      )}

      {stage === "setup" && (
        <SetupForm
          data={formData}
          workTypes={WORK_TYPES}
          onChange={handleFormChange}
          onContinue={handleContinueSetup}
          logoUri={FULL_LOGO}
        />
      )}

      {stage === "done" && (
        <SuccessScreen
          data={formData}
          workTypes={WORK_TYPES}
          onComplete={handleComplete}
        />
      )}
    </Shell>
  );
}
