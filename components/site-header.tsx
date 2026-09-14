import id from "@/messages/id.json";
import { SiteNav, type NavItem } from "@/components/site-nav";
import { WebbyMark } from "@/components/webby-mark";

/**
 * Site header, with a PillNav.
 *
 * Modelled on ReactBits' PillNav — a floating rounded container with a filled
 * pill that appears behind the item under the cursor and inverts its label. See
 * `.pill-nav__item` in globals.css for how that is done without GSAP, and why
 * the pill grows per item rather than sliding between them.
 *
 * Three items, all real destinations on this page. The rest of the brief's IA
 * (Eksperimen, Trivia, Lencana, Profil) is P0 routing work that does not exist
 * yet, and a nav full of links to 404s is worse than a short nav.
 *
 * Sticky, so the nav stays reachable and the current section stays marked as you
 * read. Frosted rather than bordered: a hard rule across the top would fight the
 * gradient the hero fades in with, and at 90% opacity the bar still separates
 * from whatever is behind it.
 *
 * The scroll spy itself lives in `SiteNav`, the page's only client component.
 */
const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: id.nav.home, delay: "[--reveal-delay:80ms]" },
  { href: "#bidang", label: id.nav.fields, delay: "[--reveal-delay:130ms]" },
  {
    href: "#cara-pakai",
    label: id.nav.howItWorks,
    delay: "[--reveal-delay:180ms]",
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-cloud-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <a
          href="/"
          className="reveal inline-flex min-h-touch shrink-0 items-center gap-2"
        >
          <WebbyMark className="h-9 w-9 shrink-0" />
          <span className="hidden font-display text-xl font-extrabold tracking-tight text-deep-charcoal sm:inline">
            {id.brand.name}
          </span>
        </a>

        <SiteNav label={id.nav.label} items={NAV_ITEMS} />
      </div>
    </header>
  );
}
