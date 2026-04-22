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

const ANON_VALUES = new Set(["all", "anon", "non"]);

const LANG_COOKIE = "kimepish-lang";

export default async function Home(props: { searchParams?: SP | Promise<SP> }) {
  noStore();

  const sp = await Promise.resolve(props.searchParams);

  const sort = sp?.sort === "top" ? "top" : "latest";

  const tags = await prisma.postTag.findMany({ orderBy: { order: "asc" } });
  const validSlugs = new Set(tags.map((tag: { slug: string }) => tag.slug));

  const rawCat = (sp?.cat ?? "").trim().toUpperCase();
  const cat = validSlugs.has(rawCat) ? rawCat : null;

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

return (
  <main className="redesign-main-content">
    <div className="redesign-card">
      <SpillComposer tags={tags} />
    </div>

    <section className="redesign-card redesign-filter-card">
      <div className="redesign-filter-row">
        <span className="redesign-filter-label">{dict["feed.sort"]}</span>
        <FeedSort />
        {sort === "top" && <div className="redesign-note">{dict["feed.sortedByLikes"]}</div>}
      </div>

      <div className="redesign-filter-row">
        <span className="redesign-filter-label">{dict["feed.category"]}</span>
        <CategoryFilter tags={tags} />
      </div>

      <div className="redesign-filter-row">
        <span className="redesign-filter-label">{dict["feed.visibility"]}</span>
        <AnonFilter />
      </div>
    </section>

    <FeedInfiniteList sort={sort} cat={cat} anon={anon} myUserId={me?.id ?? null} />
  </main>
);
}
