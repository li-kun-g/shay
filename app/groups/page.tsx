export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import RequestedBanner from "./RequestedBanner";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";

type SearchParams = { requested?: string };

const LANG_COOKIE = "kimepish-lang";

export default async function GroupsPage(props: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp = await Promise.resolve(props.searchParams);
  const showBanner = sp?.requested === "1";

  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  const lang: Lang =
    cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";

  const dict = getDict(lang);

  const groups = await prisma.group.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, followers: true } },
    },
  });

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <RequestedBanner show={showBanner} />

      <div className="rounded-2xl border bg-white p-4 space-y-2 shadow-sm">
        <div className="font-semibold">{dict["groups.title"]}</div>
        <div className="text-sm text-gray-600">
          {dict["groups.subtitle"]}
        </div>

        <Link
          href="/groups/request"
          className="inline-block mt-2 rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 transition"
        >
          ➕ {dict["groups.requestOfficial"]}
        </Link>
      </div>

      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="text-sm text-gray-500 text-center">
            {dict["groups.noneApproved"]}
          </div>
        ) : (
          groups.map((g) => (
            <Link
              key={g.id}
              href={`/g/${g.slug}`}
              className="block rounded-2xl border bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="font-semibold">{g.name}</div>
              {g.description && (
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {g.description}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                {g._count.members} {dict["groups.members"]} · {g._count.followers} {dict["groups.followers"]}
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}