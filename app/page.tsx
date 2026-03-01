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

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <SpillComposer />

      <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {dict["feed.sort"]}
            </div>
            <div className="mt-2">
              <FeedSort />
            </div>
          </div>

          {sort === "top" && (
            <div className="text-xs text-gray-500">{dict["feed.sortedByLikes"]}</div>
          )}
        </div>

        <div className="my-3 h-px bg-gray-100" />

        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {dict["feed.category"]}
            </div>
            <div className="mt-2">
              <CategoryFilter />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {dict["feed.visibility"]}
            </div>
            <AnonFilter />
          </div>
        </div>
      </section>

      <FeedInfiniteList sort={sort} cat={cat} anon={anon} myUserId={me?.id ?? null} />
    </main>
  );
}