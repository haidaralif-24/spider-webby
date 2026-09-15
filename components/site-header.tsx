import Link from "next/link";
import id from "@/messages/id.json";
import { SiteNav, type NavItem } from "@/components/site-nav";
import { WebbyMark } from "@/components/webby-mark";
import { FIELD_THEME } from "@/lib/field-theme";

/**
 * Site header, with a PillNav.
 *
 * Modelled on ReactBits' PillNav — a floating rounded container with a filled
 * pill that appears behind the item under the cursor and inverts its label. See
 * `.pill-nav__item` in globals.css for how that is done without GSAP, and why
 * the pill grows per item rather than sliding between them.
 *
 * The nav is contextual: the home page shows its own sections, and a field page
 * shows the other subjects. See `SiteNav` for which set is chosen and how each
 * one decides what is current.
 *
 * Sticky, so the nav and the way home are always reachable. Frosted rather than
 * bordered: a hard rule across the top would fight the gradient the hero fades
 * in with.
 */

/** Home: the page itself, then the two sections worth jumping to. */
const HOME_ITEMS: readonly NavItem[] = [
  { href: "/", label: id.nav.home, delay: "[--reveal-delay:80ms]" },
  { href: "#bidang", label: id.nav.fields, delay: "[--reveal-delay:130ms]" },
  {
    href: "#cara-pakai",
    label: id.nav.howItWorks,
    delay: "[--reveal-delay:180ms]",
  },
];

/**
 * A field page: home, then the three subjects.
 *
 * Each field item carries its colour as a `var()` reference so the page
 * transition knows what to wipe in. Still a token, never a hex literal.
 *
 * The remaining IA (Eksperimen, Trivia, Lencana, Profil) is still P0 routing
 * work that does not exist, and a nav full of links to 404s is worse than a
 * short nav.
 */
const FIELD_ITEMS: readonly NavItem[] = [
  { href: "/", label: id.nav.home, delay: "[--reveal-delay:80ms]" },
  {
    href: "/fisika",
    label: id.field.fisika,
    delay: "[--reveal-delay:130ms]",
    tint: FIELD_THEME.fisika.tint,
  },
  {
    href: "/kimia",
    label: id.field.kimia,
    delay: "[--reveal-delay:180ms]",
    tint: FIELD_THEME.kimia.tint,
  },
  {
    href: "/biologi",
    label: id.field.biologi,
    delay: "[--reveal-delay:230ms]",
    tint: FIELD_THEME.biologi.tint,
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-cloud-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="reveal inline-flex min-h-touch shrink-0 items-center gap-2"
        >
          <WebbyMark className="h-9 w-9 shrink-0" />
          <span className="hidden font-display text-xl font-extrabold tracking-tight text-deep-charcoal sm:inline">
            {id.brand.name}
          </span>
        </Link>

        <SiteNav
          label={id.nav.label}
          homeItems={HOME_ITEMS}
          fieldItems={FIELD_ITEMS}
        />
      </div>
    </header>
  );
}
