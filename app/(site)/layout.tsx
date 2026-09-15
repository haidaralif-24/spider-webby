import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * The public site's chrome.
 *
 * Everything kid-facing lives in this route group: the sticky header with the
 * pill nav, the `<main id="content">` the skip link points at, and the footer.
 * `/admin` sits outside the group and gets none of it — an authoring tool
 * wearing the field nav and the "Kembali ke Beranda" footer was the reason this
 * split exists.
 *
 * Route groups are invisible in the URL, so `/` and `/fisika` are unchanged.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main id="content" className="w-full flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
