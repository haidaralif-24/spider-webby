import { FieldChooser } from "@/components/field-chooser";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";

/**
 * Home.
 *
 * Three bands: hero · field chooser · how it works. The header, footer and
 * `<main>` come from the root layout, so every route gets them without having to
 * remember.
 *
 * Still to come for P0: the experiment detail page (`/eksperimen/[slug]`),
 * `<ExperimentFlow>` and `<ExperimentSteps>`, featured experiments, Today's
 * Challenge, Badge Corner.
 *
 * Copy rules for anything added here (AGENTS.md §3): short sentences, one idea
 * each, Indonesian at SD level, no walls of text.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FieldChooser />
      <HowItWorks />
    </>
  );
}
