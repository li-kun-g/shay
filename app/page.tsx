export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import SpillComposer from "@/components/SpillComposer";
import FeedSort from "@/components/FeedSort";
import CategoryFilter from "@/components/CategoryFilter";
import AnonFilter from "@/components/AnonFilter";
import FeedInfiniteList from "@/components/FeedInfiniteList";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";

type SP = { sort?: string; cat?: string; anon?: string };

const CAT_VALUES = new Set(["GOSSIPS", "UNI", "CONFESSIONS", "MARKET", "OTHER"]);
const ANON_VALUES = new Set(["all", "anon", "non"]);

const LANG_COOKIE = "kimepish-lang";

export default async function Home(props: { searchParams?: SP | Promise<SP> }) {
  noStore();

  const sp = await Promise.resolve(props.searchParams);

  const sort = sp?.sort === "top" ? "top" : "latest";

  const rawCat = (sp?.cat ?? "").trim().toUpperCase();
  const cat = CAT_VALUES.has(rawCat) ? rawCat : null;

  const rawAnon = (sp?.anon ?? "").trim().toLowerCase();
  const anon = ANON_VALUES.has(rawAnon) ? (rawAnon as "all" | "anon" | "non") : "all";

  const session = await getServerSession(authOptions);

  // language (cookie -> db -> EN)
  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  let lang: Lang = cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";

  const me = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, language: true },
      })
    : null;

  if (me?.language) lang = me.language as Lang;

  const dict = getDict(lang);
  const displayName = session?.user?.name || session?.user?.email || "User";

  return (
    <div className="redesign-page">
      <header className="redesign-topbar">
        <div className="redesign-logo">
          Shay <span>☕</span>
        </div>
        <div className="redesign-header-right">
          <button className="redesign-btn-ghost">{displayName}</button>
          <form action="/api/auth/signout" method="post">
            <input type="hidden" name="callbackUrl" value="/" />
            <button type="submit" className="redesign-btn-logout">
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="redesign-layout">
        <aside className="redesign-sidebar">
          <div className="redesign-menu-label">Menu</div>
          <nav className="redesign-nav">
            <a href="#" className="active">Feed</a>
            <a href="#">Events</a>
            <a href="#">My Campus</a>
            <a href="#">Groups</a>
            <a href="#">Messages</a>
            <a href="#">Notifications</a>
            <a href="#">Friends</a>
            <a href="#">Settings</a>
          </nav>
        </aside>

        <main className="redesign-main">
          <div className="redesign-card">
            <SpillComposer />
          </div>

          <section className="redesign-card redesign-filter-card">
            <div className="redesign-filter-row">
              <span className="redesign-filter-label">{dict["feed.sort"]}</span>
              <FeedSort />
              {sort === "top" && (
                <div className="redesign-note">{dict["feed.sortedByLikes"]}</div>
              )}
            </div>

            <div className="redesign-filter-row">
              <span className="redesign-filter-label">{dict["feed.category"]}</span>
              <CategoryFilter />
            </div>

            <div className="redesign-filter-row">
              <span className="redesign-filter-label">{dict["feed.visibility"]}</span>
              <AnonFilter />
            </div>
          </section>

          <FeedInfiniteList sort={sort} cat={cat} anon={anon} myUserId={me?.id ?? null} />
        </main>
      </div>
    </div>
  );
}
