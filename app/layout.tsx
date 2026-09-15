import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TransitionProvider } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import id from "@/messages/id.json";
import "./globals.css";

/**
 * Indonesian is primary and serves at the root (AGENTS.md §4.7). English goes
 * under `/en/...` later — a content change, not a refactor.
 *
 * No webfont here on purpose: body text is a system stack so a phone on mobile
 * data pays zero font bytes (brief §5.8). See `--font-display` in globals.css.
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
 *
 * The chrome lives here rather than in each page. It used to be rendered by the
 * home page, which meant every new route would have had to remember to include
 * it — and the field pages are the first of several.
 *
 * `TransitionProvider` wraps everything because the page wipe has to sit above
 * the sticky header (z-50) and the nav inside it is what starts a transition.
 * It is a client component wrapping server children, which is the standard
 * shape — the children stay server-rendered and are passed through as props.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-deep-charcoal focus:px-4 focus:py-2 focus:text-cloud-white"
        >
          {id.a11y.skipToContent}
        </a>
        <TransitionProvider>
          <SiteHeader />
          <main id="content" className="w-full flex-1">
            {children}
          </main>
          <SiteFooter />
        </TransitionProvider>
      </body>
    </html>
  );
}
