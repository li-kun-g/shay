export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import GroupActions from "./ui";
import AdminControls from "@/app/g/[slug]/AdminControls";
import AdminMemberControls from "./AdminMemberControls";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EventCard from "@/components/EventCard";
import GroupEventsInfiniteList from "@/components/GroupEventsInfiniteList";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";

type Params = { slug: string };
type SearchParams = { tab?: string; created?: string; sort?: string };

type PendingRequestRow = {
  id: string;
  message: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    name: string | null;
  };
};

type MemberRole = "PRESIDENT" | "ADMIN" | "MEMBER";

type MemberRow = {
  id: string;
  role: MemberRole;
  position: string | null;
  showPosition: boolean;
  joinedAt: Date;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    emoji: string;
  };
};

type GroupEventRow = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startsAt: Date;
  createdAt: Date;
  imageUrl?: string | null;
  createdBy: {
    username: string;
    name: string | null;
    image: string | null;
    emoji: string;
  };
  group: {
    slug: string;
    image: string | null;
    name: string;
  } | null;
  _count: {
    attendees: number;
  };
  attendees: {
    user: {
      id: string;
      username: string;
      name: string | null;
      image: string | null;
      emoji: string;
    };
  }[];
};

const LANG_COOKIE = "kimepish-lang";

function TabLink({
  slug,
  tab,
  active,
  label,
}: {
  slug: string;
  tab: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={`/g/${slug}?tab=${tab}`}
      className={
        "rounded-full border px-3 py-1 text-sm transition " +
        (active 
          ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
          : "bg-white hover:bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-800 dark:hover:bg-zinc-800")
      }
    >
      {label}
    </Link>
  );
}

function SortPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 text-sm transition " +
        (active 
          ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
          : "bg-white hover:bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-800 dark:hover:bg-zinc-800")
      }
    >
      {label}
    </Link>
  );
}

export default async function GroupPage(props: {
  params: Params | Promise<Params>;
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const p = await Promise.resolve(props.params);
  const sp = await Promise.resolve(props.searchParams);

  const slug = (p?.slug ?? "").trim().toLowerCase();
  if (!slug) notFound();

  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  const lang: Lang =
    cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";
  const dict = getDict(lang);

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      president: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          emoji: true,
        },
      },
      _count: { select: { members: true, followers: true } },
    },
  });

  if (!group || group.status !== "APPROVED") notFound();

  const [memberRow, followRow, pendingRow] = myId
    ? await Promise.all([
        prisma.groupMember.findFirst({
          where: { groupId: group.id, userId: myId },
          select: { id: true, role: true },
        }),
        prisma.groupFollow.findFirst({
          where: { groupId: group.id, userId: myId },
          select: { id: true },
        }),
        prisma.groupJoinRequest.findFirst({
          where: { groupId: group.id, userId: myId, status: "PENDING" },
          select: { id: true },
        }),
      ])
    : [null, null, null];

  const isMember = !!memberRow;
  const isFollowing = !!followRow;
  const hasPendingRequest = !!pendingRow;

  const myRole = memberRow?.role ?? null;
  const canAdmin = myRole === "PRESIDENT" || myRole === "ADMIN";
  const canManageRoles = myRole === "PRESIDENT";
  const canEditGroup = canAdmin;

  const pendingRequests: PendingRequestRow[] = canAdmin
    ? await prisma.groupJoinRequest.findMany({
        where: { groupId: group.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, username: true, name: true } } },
        take: 50,
      })
    : [];

  const tab = (sp?.tab ?? "about").toLowerCase();
  const activeTab = (["about", "events", "members"] as const).includes(tab as any)
    ? (tab as "about" | "events" | "members")
    : "about";

  const created = sp?.created === "1";

  const sortRaw = (sp?.sort ?? "soon").toLowerCase();
  const sort = (["soon", "going", "new"] as const).includes(sortRaw as any)
    ? (sortRaw as "soon" | "going" | "new")
    : "soon";

  const membersVisibility = (group as any).membersListVisibility as
    | "PUBLIC"
    | "MEMBERS_ONLY"
    | undefined;

  const canViewMembers =
    membersVisibility !== "MEMBERS_ONLY" || isMember || canAdmin;

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      {/* MAIN GROUP CARD */}
      <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 shadow-sm sm:p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-gray-100 dark:bg-zinc-800 dark:border-zinc-700 sm:h-20 sm:w-20">
              {group.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={group.image}
                  alt={group.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl text-gray-500">
                  ☕
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight sm:text-2xl break-words text-gray-900 dark:text-white">
                {group.name}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400 break-words mt-0.5">
                @{group.slug}
              </div>
            </div>
          </div>

          {myId && (
            <div className="flex flex-col gap-2 w-full sm:w-[220px] shrink-0 mt-2 sm:mt-0">
              <GroupActions
                groupId={group.id}
                isMember={isMember}
                isFollowing={isFollowing}
                hasPendingRequest={hasPendingRequest}
                className="w-full"
              />

              {canEditGroup && (
                <Link
                  href={`/g/${group.slug}/edit`}
                  className="w-full inline-flex justify-center rounded-xl border border-gray-200 dark:border-zinc-800 px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                >
                  {dict["common.edit"]}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* INFO AND STATS */}
        <div className="space-y-3 pt-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dict["group.president"]}:{" "}
            <Link href={`/u/${group.president.username}`} className="font-medium hover:underline text-black dark:text-white">
              @{group.president.username}
            </Link>
          </div>

          {group.description && (
            <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
              {group.description}
            </div>
          )}

          {/* SEPARATED STATS SECTION */}
          <div className="flex items-center gap-3 text-sm pt-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-black dark:text-white">{group._count.members}</span>
              <span className="text-gray-500 dark:text-gray-400">{dict["groups.members"]}</span>
            </div>
            
            <div className="h-3 w-[1px] bg-gray-300 dark:bg-zinc-700 mx-0.5" />
            
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-black dark:text-white">{group._count.followers}</span>
              <span className="text-gray-500 dark:text-gray-400">{dict["groups.followers"]}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t dark:border-zinc-800">
          <TabLink
            slug={group.slug}
            tab="about"
            active={activeTab === "about"}
            label={dict["group.tab.about"]}
          />
          <TabLink
            slug={group.slug}
            tab="events"
            active={activeTab === "events"}
            label={dict["group.tab.events"]}
          />
          <TabLink
            slug={group.slug}
            tab="members"
            active={activeTab === "members"}
            label={dict["group.tab.members"]}
          />
        </div>
      </div>

      {activeTab === "about" && (
        <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 shadow-sm">
          <div className="font-semibold text-gray-900 dark:text-white">{dict["group.aboutTitle"]}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {dict["group.aboutDesc"]}
          </div>
        </div>
      )}

      {/* EVENTS AND MEMBERS TABS (already adapted) */}
      {/* ... keeping the rest of the logic as is, ensuring containers have dark:bg-zinc-900 ... */}
      
      {activeTab === "events" && (
        <>
          <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            {created && (
              <div className="rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/20 p-4 text-sm text-green-800 dark:text-green-400 shadow-sm">
                ✅ {dict["group.eventCreated"]}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{dict["group.eventsTitle"]}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dict["group.eventsDesc"]}
                </div>
              </div>

              {canAdmin && (
                <Link
                  href={`/g/${group.slug}/events/new`}
                  className="rounded-xl bg-black dark:bg-white px-4 py-2 text-sm text-white dark:text-black font-medium transition active:scale-95"
                >
                  {dict["events.new.title"]}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <SortPill
                href={`/g/${group.slug}?tab=events&sort=soon`}
                active={sort === "soon"}
                label={dict["events.sort.soon"]}
              />
              <SortPill
                href={`/g/${group.slug}?tab=events&sort=going`}
                active={sort === "going"}
                label={dict["events.sort.going"]}
              />
              <SortPill
                href={`/g/${group.slug}?tab=events&sort=new`}
                active={sort === "new"}
                label={dict["events.sort.new"]}
              />
            </div>
          </div>

          <GroupEventsInfiniteList groupId={group.id} sort={sort} />
        </>
      )}

      {activeTab === "members" && (
        <MembersTab
          groupId={group.id}
          groupSlug={group.slug}
          myId={myId}
          canAdmin={canAdmin}
          canManageRoles={canManageRoles}
          canViewMembers={canViewMembers}
          isMember={isMember}
          visibility={membersVisibility ?? "PUBLIC"}
          pendingRequests={pendingRequests.map((r: PendingRequestRow) => ({
            id: r.id,
            message: r.message,
            createdAt: r.createdAt.toISOString(),
            user: {
              id: r.user.id,
              username: r.user.username,
              name: r.user.name,
            },
          }))}
          dict={dict}
        />
      )}
    </main>
  );
}

// Ensure MembersTab containers also have dark:bg-zinc-900
async function MembersTab(props: {
  groupId: string;
  groupSlug: string;
  myId: string | null;
  canAdmin: boolean;
  canManageRoles: boolean;
  canViewMembers: boolean;
  isMember: boolean;
  visibility: "PUBLIC" | "MEMBERS_ONLY";
  pendingRequests: {
    id: string;
    message: string | null;
    createdAt: string;
    user: { id: string; username: string; name: string | null };
  }[];
  dict: Record<string, string>;
}) {
  const {
    groupId,
    myId,
    canAdmin,
    canManageRoles,
    pendingRequests,
    canViewMembers,
    isMember,
    visibility,
    dict,
  } = props;

  if (!canViewMembers) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 shadow-sm">
          <div className="font-semibold text-gray-900 dark:text-white">{dict["group.tab.members"]}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {dict["group.membersPrivate"]}
          </div>
        </div>
      </div>
    );
  }

  const members: MemberRow[] = await prisma.groupMember.findMany({
    where: { groupId },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          emoji: true,
        },
      },
    },
    take: 200,
  });

  return (
    <div className="space-y-3">
      {canAdmin && (
        <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 shadow-sm">
          <div className="font-semibold text-gray-900 dark:text-white">{dict["group.membershipRequests"]}</div>
          <div className="mt-3">
            <AdminControls groupId={groupId} requests={pendingRequests} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-white">{dict["group.tab.members"]}</div>
        </div>

        {members.length === 0 ? (
          <div className="text-sm text-gray-500">{dict["group.noMembersYet"]}</div>
        ) : (
          <div className="space-y-2">
            {members.map((m: MemberRow) => {
              const isSelf = !!myId && m.user.id === myId;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border dark:border-zinc-800 px-3 py-2 bg-gray-50 dark:bg-zinc-900/50"
                >
                  <Link href={`/u/${m.user.username}`} className="min-w-0 hover:underline">
                    <div className="text-sm font-medium text-gray-900 dark:text-white break-words">@{m.user.username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{m.role}</div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}