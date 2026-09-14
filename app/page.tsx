import { FieldChooser } from "@/components/field-chooser";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Home.
 *
 * Five bands, top to bottom: header · hero · field chooser · how it works ·
 * footer. The page was previously two bands on a document barely taller than
 * the viewport, which read as an unfinished page rather than as a landing page.
 *
 * Still to come for P0: the field routes themselves (`/fisika`, `/kimia`,
 * `/biologi`), experiment detail, `<ExperimentFlow>` and `<ExperimentSteps>`,
 * featured experiments, Today's Challenge, Badge Corner, and seed data in
 * `content/`. The field cards' "Lihat halaman" button already points at the
 * right hrefs, so shipping those routes is the only change it needs.
 *
 * Copy rules for anything added here (AGENTS.md §3): short sentences, one idea
 * each, Indonesian at SD level, no walls of text.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="content" className="w-full flex-1">
        <HeroSection />
        <FieldChooser />
        <HowItWorks />
      </main>
      <SiteFooter />
    </>
  );
}
