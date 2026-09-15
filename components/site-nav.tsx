"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { usePageTransition } from "@/components/page-transition";

/**
 * The pill navigation.
 *
 * Two sets of items, chosen by where you are:
 *
 * - **Home** — Beranda · Bidang · Cara pakai. One route and two sections of the
 *   page you are already on.
 * - **A field page** — Beranda · Fisika · Kimia · Biologi. Once you are inside a
 *   subject, the useful navigation is the other subjects, not sections of a page
 *   you have left.
 *
 * The active item comes from two different places, because the two sets are two
 * different kinds of link:
 *
 * - Route items match `usePathname()`. A string comparison.
 * - Section items are tracked by a scroll position, because "which part of this
 *   page am I looking at" is not knowable from the URL.
 *
 * And the click decides how the page changes: entering a subject from somewhere
 * that is not a subject gets the iris, moving between subjects gets a slide in
 * the direction of travel. See `components/page-transition.tsx`.
 *
 * `"use client"` is for the pathname, the section tracking, the transition and
 * the reload scroll reset — and nothing else. Every visual lives in CSS.
 */

/**
 * How far down the viewport a section's top has to be before it counts as the
 * one you are reading. The sticky header is ~74px, and anchored sections land at
 * `scroll-mt-24` (96px), so anything above 140 marks the section you just
 * navigated to.
 */
const ACTIVE_LINE_PX = 140;

export type NavItem = {
  href: string;
  label: string;
  /** Stagger for the load entrance, written out at the call site because
   *  Tailwind scans for complete class names. */
  delay: string;
  /** The field colour as a `var()` reference, for the transition wipe. Only the
   *  field routes carry one. */
  tint?: string;
};

type SiteNavProps = {
  /** Accessible name for the `<nav>` landmark. */
  label: string;
  /** Shown on the home page: one route plus in-page sections. */
  homeItems: readonly NavItem[];
  /** Shown on a field page: the route home plus the three field routes. */
  fieldItems: readonly NavItem[];
};

export function SiteNav({ label, homeItems, fieldItems }: SiteNavProps) {
  const pathname = usePathname();
  const transition = usePageTransition();

  const currentFieldIndex = fieldItems.findIndex(
    (item) => item.href === pathname,
  );
  const onFieldPage = currentFieldIndex >= 0;
  const items = onFieldPage ? fieldItems : homeItems;

  const [sectionHref, setSectionHref] = useState<string | null>(null);

  /**
   * A refresh should land at the top of the page.
   *
   * Without this, two separate mechanisms strand the reader mid-page after a
   * reload, and both were measured against a static build:
   *   - a `#hash` in the URL re-anchors on load (`/#cara-pakai` came back at
   *     y=1144)
   *   - with no hash at all, the browser restores the previous scroll offset
   *     (reloaded after scrolling to y=1100, came back at y=1100)
   *
   * Only on `reload` — a fresh navigation to a `#hash` is a deep link and still
   * goes where it points. A client-side route change does not report here at
   * all, so the page transitions are unaffected.
   *
   * `behavior: "instant"` because `html` carries `scroll-behavior: smooth`,
   * which would otherwise animate every single reload from the old offset up to
   * the top.
   */
  useEffect(() => {
    const entry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (entry?.type !== "reload") return;

    history.scrollRestoration = "manual";
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  /**
   * Which home-page section is current.
   *
   * This was an IntersectionObserver with a band across the middle of the
   * viewport, and it reported the wrong section. The home page barely scrolls —
   * the document is 1518px against a 900px viewport — and `#bidang` is only
   * 320px tall, so once an anchor jump put that section's top at 96px, the band
   * at 45–55% (405–495px) landed on `#cara-pakai` instead. Measured: clicking
   * "Bidang" marked "Cara pakai".
   *
   * A line near the top is the honest model: a section is current from the
   * moment its top passes under the header until the next one does. The one
   * thing a line cannot express is the bottom of a short page, where the last
   * section can never reach it — so that case is handled explicitly.
   */
  useEffect(() => {
    const sections = homeItems
      .filter((item) => item.href.startsWith("#"))
      .flatMap((item) => {
        const el = document.getElementById(item.href.slice(1));
        return el ? [{ href: item.href, el }] : [];
      });

    /* Nothing to observe on this route. Deliberately no `setSectionHref(null)`
     * here: a synchronous setState in an effect body cascades a render, and
     * `homeActive` below already refuses to read the stored value anywhere but
     * the home page — so a stale section cannot leak onto a field page or a
     * 404. */
    if (sections.length === 0) return;

    let frame = 0;

    const update = () => {
      frame = 0;

      const line = window.scrollY + ACTIVE_LINE_PX;
      let next: string | null = null;
      for (const section of sections) {
        const top = section.el.getBoundingClientRect().top + window.scrollY;
        if (top <= line) next = section.href;
      }

      /* A short page can run out of scroll before the last section reaches the
       * line, so being at the bottom means the last section. Guarded on the page
       * actually being scrollable, or a tall desktop viewport would mark the
       * last section from the very top. */
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight > window.innerHeight + 4;
      if (
        scrollable &&
        window.scrollY + window.innerHeight >= doc.scrollHeight - 4
      ) {
        next = sections[sections.length - 1].href;
      }

      setSectionHref((previous) => (previous === next ? previous : next));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [homeItems, pathname]);

  /**
   * Only the home page has sections, so only the home page may be marked from
   * one — "Beranda" is current at the top, a section takes over once you scroll
   * to it. Anywhere else nothing is current, which is correct: a reader on a
   * field page or a 404 is not on a home-page section, and marking one would be
   * a lie.
   */
  const homeHref = homeItems[0]?.href ?? "";
  const homeActive = pathname === homeHref ? (sectionHref ?? homeHref) : "";
  const active = onFieldPage ? pathname : homeActive;

  /**
   * The click decides the transition.
   *
   * Field to field slides, in the direction the navbar reads. Into a field from
   * anywhere else irises. Everything else falls through to `next/link` and
   * changes page with no ceremony — the home page's own sections do not deserve
   * a 700ms wipe.
   */
  const go = (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => {
    if (item.href === pathname) {
      event.preventDefault();
      return;
    }

    if (!item.tint || !transition) return;

    const targetIndex = fieldItems.findIndex(
      (field) => field.href === item.href,
    );
    if (targetIndex < 0) return;

    event.preventDefault();
    transition({
      href: item.href,
      mode: onFieldPage ? "slide" : "iris",
      tint: item.tint,
      direction:
        onFieldPage && targetIndex < currentFieldIndex ? "backward" : "forward",
    });
  };

  return (
    <nav aria-label={label} className="no-scrollbar overflow-x-auto">
      {/* Lab Mist, not Cloud White, and no hard offset shadow. The shadow was
       * the "black thing": a 4px charcoal offset on a `rounded-full` container
       * shows up as a dark crescent on the bottom right. The sticker shadow
       * needs a rectangle to work; on a pill it does not. */}
      <ul className="flex items-center gap-1 rounded-full border-[3px] border-deep-charcoal bg-lab-mist p-1">
        {items.map((item) => {
          const className = `pill-nav__item reveal ${item.delay} px-2.5 text-xs sm:px-4 sm:text-sm`;
          const inner = <span>{item.label}</span>;
          const current = active === item.href;

          return (
            <li key={item.href}>
              {item.href.startsWith("/") ? (
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={className}
                  onClick={(event) => go(item, event)}
                >
                  {inner}
                </Link>
              ) : (
                /* In-page sections stay plain anchors: `next/link` would add
                 * nothing and the hash is what drives the smooth scroll. */
                <a
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={className}
                >
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
