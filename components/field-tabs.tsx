import id from "@/messages/id.json";

/**
 * The Experiment / Trivia tab bar.
 *
 * Trivia is deliberately not a link. It is P2 work — it needs questions, a
 * scoring round-trip and a `award_points()` RPC (brief §5.5), none of which
 * exist. A tab that 404s is worse than a tab that says when it is coming, and
 * the brief's IA is honest about it being planned.
 *
 * The active tab reuses `.pill-nav__item`, so the fill behaves exactly like the
 * header nav — the two tab-like controls on the site should not animate
 * differently.
 */
export function FieldTabs() {
  return (
    <nav
      aria-label={id.fieldPage.tabsLabel}
      className="mx-auto w-full max-w-5xl px-4 sm:px-6"
    >
      <ul className="inline-flex items-center gap-1 rounded-full border-[3px] border-deep-charcoal bg-cloud-white p-1">
        <li>
          <a
            href="#eksperimen"
            aria-current="location"
            className="pill-nav__item px-4 text-sm"
          >
            <span>{id.tabs.eksperimen}</span>
          </a>
        </li>
        <li>
          {/* Charcoal at 70%, not 45% — 45% lands at 2.7:1 and fails the
           * body-text floor. The "segera" badge carries the unavailable state
           * instead of the contrast does (AGENTS.md §4.9). */}
          <span className="inline-flex min-h-touch items-center gap-2 rounded-full px-4 text-sm font-bold text-deep-charcoal/70">
            {id.tabs.trivia}
            <span className="rounded-full bg-discovery-yellow px-2 py-0.5 text-xs font-bold text-deep-charcoal">
              {id.fieldPage.soon}
            </span>
          </span>
        </li>
      </ul>
    </nav>
  );
}
