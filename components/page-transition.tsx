"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Page transitions between the field pages.
 *
 * Two shapes, because the two journeys are different:
 *
 * - **Iris** — arriving at a subject from somewhere that is not a subject (home,
 *   a 404). The screen washes over in that field's colour with a circular hole
 *   in the middle, the page swaps behind the solid colour, then the hole opens
 *   and the subject is there. It is the cartoon reveal, and it is the site's way
 *   of saying "you are entering Physics now".
 * - **Slide** — moving between subjects from the navbar. The curtain enters from
 *   the side you are travelling towards and leaves out the other, so the motion
 *   matches the direction of the nav item you clicked.
 *
 * Not the View Transitions API, deliberately. That API needs the router to
 * commit the new document inside `startViewTransition`, and with the App Router
 * the RSC payload arrives asynchronously — the snapshot ends up capturing the
 * old page. An overlay the transition itself controls is simpler, works in every
 * browser rather than just the ones that ship the API, and gives the swap an
 * opaque moment to happen behind, which is what makes a cover-and-reveal
 * possible at all.
 *
 * The cost is honest: a navigation now takes ~720ms instead of feeling instant.
 * That is the whole point of the request, and `prefers-reduced-motion` skips it
 * entirely.
 *
 * The nav must use `next/link`, not `<a>`. A plain anchor is a full document
 * load: the overlay would be torn down mid-animation and the user would watch a
 * white flash instead.
 */

export type TransitionMode = "iris" | "slide";
export type TransitionDirection = "forward" | "backward";

/** Cover is short — it is a wipe, not a wait. Reveal is where the flourish is. */
const COVER_MS = 300;
const REVEAL_MS = 420;
/** If the route never arrives, do not leave the screen covered forever. */
const BAILOUT_MS = 4000;

type Request = {
  href: string;
  mode: TransitionMode;
  tint: string;
  direction: TransitionDirection;
};

type State = {
  phase: "idle" | "cover" | "reveal";
  mode: TransitionMode;
  tint: string;
  direction: TransitionDirection;
};

const IDLE: State = {
  phase: "idle",
  mode: "iris",
  tint: "var(--color-fun-purple)",
  direction: "forward",
};

/**
 * Start a transitioned navigation, or `null` outside the provider.
 *
 * Null rather than a no-op function on purpose: a caller that cannot start a
 * transition must let the link navigate normally, not swallow the click.
 */
const TransitionContext = createContext<((request: Request) => void) | null>(
  null,
);

export function usePageTransition() {
  return useContext(TransitionContext);
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>(IDLE);
  const phase = useRef<State["phase"]>("idle");
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);

  const settle = useCallback(() => {
    clearTimers();
    phase.current = "idle";
    setState((previous) => ({ ...previous, phase: "idle" }));
  }, [clearTimers]);

  const navigate = useCallback(
    ({ href, mode, tint, direction }: Request) => {
      if (
        typeof window === "undefined" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        router.push(href);
        return;
      }

      clearTimers();
      phase.current = "cover";
      setState({ phase: "cover", mode, tint, direction });

      /* Navigate once the screen is covered, so the swap happens where nobody
       * can see it. The route change is what opens the hole again — see the
       * effect below. */
      timers.current.push(
        window.setTimeout(() => router.push(href), COVER_MS),
        window.setTimeout(settle, BAILOUT_MS),
      );
    },
    [clearTimers, router, settle],
  );

  /* The route has changed while we are covered: open back up. The short delay
   * lets the new page paint once behind the opaque cover first, so the reveal
   * uncovers a finished page rather than a blank one. */
  useEffect(() => {
    if (phase.current !== "cover") return;

    const openTimer = window.setTimeout(() => {
      phase.current = "reveal";
      setState((previous) => ({ ...previous, phase: "reveal" }));

      timers.current.push(
        window.setTimeout(() => {
          phase.current = "idle";
          setState((previous) => ({ ...previous, phase: "idle" }));
        }, REVEAL_MS),
      );
    }, 60);

    return () => window.clearTimeout(openTimer);
  }, [pathname]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <TransitionContext.Provider value={navigate}>
      {children}
      {/* Decorative and inert: it never receives a pointer and is never
       * announced. `data-phase="idle"` keeps it out of the paint entirely. */}
      <div
        aria-hidden="true"
        className="page-wipe"
        data-phase={state.phase}
        data-mode={state.mode}
        data-direction={state.direction}
        style={{ "--wipe-tint": state.tint } as CSSProperties}
      />
    </TransitionContext.Provider>
  );
}
