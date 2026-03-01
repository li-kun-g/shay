export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateGroupMembersListVisibility } from "@/app/actions/upgradeGroupMembersListVisibility";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";

type Row = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  description: string | null;
  membersListVisibility: "EVERYONE" | "MEMBERS_ONLY";
  roleLabel: string;
};

function RoleBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-[11px] text-gray-500 bg-white">
      {label}
    </span>
  );
}

const LANG_COOKIE = "kimepish-lang";

export default async function GroupPrivacySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) return null;

  const myId = session.user.id as string;

  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  let lang: Lang = cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { language: true },
  });

  if (me?.language) lang = me.language as Lang;

  const dict = getDict(lang);

  const presidentGroups = await prisma.group.findMany({
    where: { presidentId: myId, status: "APPROVED" },
    select: {
      id: true,
      slug: true,
      name: true,
      image: true,
      description: true,
      membersListVisibility: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const adminMemberships = await prisma.groupMember.findMany({
    where: {
      userId: myId,
      role: { in: ["ADMIN", "PRESIDENT"] },
      group: { status: "APPROVED" },
    },
    select: {
      role: true,
      group: {
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
          description: true,
          membersListVisibility: true,
          presidentId: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const map = new Map<string, Row>();

  for (const g of presidentGroups) {
    map.set(g.id, {
      id: g.id,
      slug: g.slug,
      name: g.name,
      image: g.image,
      description: g.description,
      membersListVisibility: g.membersListVisibility,
      roleLabel: dict["settings.groups.rolePresident"],
    });
  }

  for (const m of adminMemberships) {
    const g = m.group;
    if (!g) continue;
    if (map.has(g.id)) continue;
    if (g.presidentId !== myId && (m.role !== "ADMIN" && m.role !== "PRESIDENT")) continue;

    map.set(g.id, {
      id: g.id,
      slug: g.slug,
      name: g.name,
      image: g.image,
      description: g.description,
      membersListVisibility: g.membersListVisibility,
      roleLabel:
        m.role === "ADMIN"
          ? dict["settings.groups.roleAdmin"]
          : dict["settings.groups.rolePresident"],
    });
  }

  const groups = Array.from(map.values());

  return (
    <main className="mx-auto max-w-md px-4 py-6 md:max-w-2xl space-y-4">
      <Link href="/settings" className="text-sm text-gray-500 hover:underline">
        {dict["settings.back"]}
      </Link>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">{dict["settings.groups.title"]}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {dict["settings.groups.pageDesc"]}
        </p>
      </section>

      {groups.length === 0 ? (
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">{dict["settings.groups.noneTitle"]}</div>
          <p className="mt-1 text-sm text-gray-500">
            {dict["settings.groups.noneDesc"]}
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl border bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {g.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.image} alt={g.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg">👥</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/g/${g.slug}`} className="font-semibold hover:underline">
                      {g.name}
                    </Link>
                    <RoleBadge label={g.roleLabel} />
                    <span className="text-xs text-gray-400">@{g.slug}</span>
                  </div>

                  {g.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{g.description}</p>
                  )}

                  <form action={updateGroupMembersListVisibility} className="mt-3 flex items-center gap-2">
                    <input type="hidden" name="groupId" value={g.id} />

                    <select
                      name="membersListVisibility"
                      defaultValue={g.membersListVisibility}
                      className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    >
                      <option value="EVERYONE">{dict["settings.groups.everyone"]}</option>
                      <option value="MEMBERS_ONLY">{dict["settings.groups.membersOnly"]}</option>
                    </select>

                    <button
                      type="submit"
                      className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                    >
                      {dict["common.save"]}
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-600">
                {dict["settings.groups.tip.before"]} <b>{dict["settings.groups.tip.bold"]}</b>
                {dict["settings.groups.tip.after"]}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}