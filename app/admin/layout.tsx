import type { ReactNode } from "react";

/**
 * The admin shell.
 *
 * Outside the `(site)` route group on purpose, so none of the kid-facing chrome
 * comes with it. `noindex` covers every page underneath (brief §7 — `/admin/**`
 * is authoring).
 *
 * The `#content` id is here rather than in the site layout because the root
 * layout's skip link points at it and has to resolve on every route.
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div id="content" className="flex w-full flex-1 flex-col bg-cloud-white">
      {children}
    </div>
  );
}
