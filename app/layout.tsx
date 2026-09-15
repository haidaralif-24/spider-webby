import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TransitionProvider } from "@/components/page-transition";
import id from "@/messages/id.json";
import "./globals.css";

/**
 * The root layout: document shell only.
 *
 * It deliberately renders **no site chrome**. That lives one level down, in
 * `app/(site)/layout.tsx`, so `/admin` can have its own without inheriting the
 * kid-facing header, the field nav and the footer. Route groups do not affect
 * URLs — `/`, `/fisika` and `/admin` are unchanged by the parentheses.
 *
 * The page-transition provider stays here rather than in the site group because
 * the overlay has to sit above the sticky header (z-50), and the nav that
 * triggers a transition lives inside that header.
 *
 * Indonesian is primary and serves at the root (AGENTS.md §4.7). English goes
 * under `/en/...` later — a content change, not a refactor.
 *
 * No webfont on purpose: body text is a system stack so a phone on mobile data
 * pays zero font bytes (brief §5.8). See `--font-display` in globals.css.
 */
export const metadata: Metadata = {
  title: {
    default: id.meta.title,
    template: `%s · ${id.meta.title}`,
  },
  description: id.meta.description,
};

/**
 * Props are declared explicitly rather than via Next's generated `LayoutProps<"/">`
 * helper: those types only exist after a build has populated `.next/types`, which
 * would make `npm run typecheck` fail on a clean checkout (AGENTS.md §9 requires it
 * to pass on its own).
 */
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    /* `data-scroll-behavior="smooth"` tells Next that `html` has smooth
     * scrolling, so it can disable it for the scroll-to-top of a route change.
     * Without it Next logs a warning and the navigation scroll animates. */
    <html lang="id" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-deep-charcoal focus:px-4 focus:py-2 focus:text-cloud-white"
        >
          {id.a11y.skipToContent}
        </a>
        <TransitionProvider>{children}</TransitionProvider>
      </body>
    </html>
  );
}
