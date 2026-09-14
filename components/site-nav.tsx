"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The pill navigation, with a scroll spy.
 *
 * `"use client"` on purpose, and it is the only client component on the page.
 * A scroll spy cannot be done in CSS: nothing in the cascade can read "which
 * section is crossing the viewport" and reflect it onto a link in a different
 * part of the tree, so the choice was a small island here or no indicator at
 * all. AGENTS.md §7 allows exactly this — "add `use client` only when
 * interactivity genuinely requires it, and keep those components as leaves" —
 * while §4.5's zero-JS rule is about how the *content* renders. It is worth
 * re-reading §4.5 before adding a second island.
 *
 * Everything visual still lives in CSS: the pill fill, the hover, the entrance.
 * This component only ever decides one attribute, `aria-current`.
 */

export type NavItem = {
  href: string;
  label: string;
  /** Stagger for the load entrance, written out at the call site because
   *  Tailwind scans for complete class names. */
  delay: string;
};

type SiteNavProps = {
  /** Accessible name for the `<nav>` landmark. */
  label: string;
  items: readonly NavItem[];
};

export function SiteNav({ label, items }: SiteNavProps) {
  const [active, setActive] = useState<string>(items[0]?.href ?? "");
  const visible = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fallback = items[0]?.href ?? "";

    const sections = items
      .filter((item) => item.href.startsWith("#"))
      .flatMap((item) => {
        const el = document.getElementById(item.href.slice(1));
        return el ? [{ href: item.href, el }] : [];
      });

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const match = sections.find((section) => section.el === entry.target);
          if (!match) continue;
          if (entry.isIntersecting) visible.current.add(match.href);
          else visible.current.delete(match.href);
        }

        /* Sections are entered top to bottom, so the most recently entered one
         * is the lowest on screen and therefore the current one. When nothing
         * is in the band we are back above the first section, which is home. */
        const inView = [...visible.current];
        setActive(inView.length > 0 ? inView[inView.length - 1] : fallback);
      },
      /* A band across the middle of the viewport. A section counts as current
       * while it crosses that line, which is stable under fast scrolling and
       * gives each section a clear turn. */
      { rootMargin: "-45% 0px -45% 0px" },
    );

    for (const section of sections) observer.observe(section.el);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className="no-scrollbar overflow-x-auto">
      {/* Lab Mist, not Cloud White, and no hard offset shadow.
       *
       * The shadow was the "black thing": a 4px charcoal offset on a
       * `rounded-full` container shows up as a dark crescent on the bottom
       * right, which at nav scale reads as a smudge rather than as depth. The
       * sticker shadow needs a rectangle to work; on a pill it does not.
       *
       * The mint fill ties the bar to the hero and the "Cara pakai" band
       * instead of leaving a white pill on a white header. */}
      <ul className="flex items-center gap-1 rounded-full border-[3px] border-deep-charcoal bg-lab-mist p-1">
        {items.map((item) => {
          const isActive = active === item.href;
          const isPage = item.href === "/";
          return (
            <li key={item.href}>
              <a
                href={item.href}
                /* "page" for the route, "location" for a section within the
                 * current page — `aria-current="page"` on an in-page anchor is
                 * a lie the screen reader has to repeat. */
                aria-current={isActive ? (isPage ? "page" : "location") : undefined}
                className={`pill-nav__item reveal ${item.delay} px-2.5 text-xs sm:px-4 sm:text-sm`}
              >
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
