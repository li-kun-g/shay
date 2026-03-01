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
        (active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50")
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
        (active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50")
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

  const ACTION_W = "w-[220px]";

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border bg-gray-100">
                {group.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={group.image}
                    alt={group.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                    ☕
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-xl font-semibold break-words">{group.name}</div>
                <div className="text-sm text-gray-500 mt-1 break-words">@{group.slug}</div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              {dict["group.president"]}:{" "}
              <Link href={`/u/${group.president.username}`} className="underline">
                @{group.president.username}
              </Link>
            </div>

            {group.description && (
              <div className="text-sm text-gray-700 mt-3 whitespace-pre-wrap break-words">
                {group.description}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-3">
              {group._count.members} {dict["groups.members"]} · {group._count.followers}{" "}
              {dict["groups.followers"]}
            </div>
          </div>

          {myId && (
            <div className="shrink-0 flex flex-col items-end gap-2">
              <GroupActions
                groupId={group.id}
                isMember={isMember}
                isFollowing={isFollowing}
                hasPendingRequest={hasPendingRequest}
                className={ACTION_W}
              />

              {canEditGroup && (
                <Link
                  href={`/g/${group.slug}/edit`}
                  className={[
                    ACTION_W,
                    "inline-flex justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50",
                  ].join(" ")}
                >
                  {dict["common.edit"]}
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
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
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-semibold">{dict["group.aboutTitle"]}</div>
          <div className="text-sm text-gray-600 mt-2">
            {dict["group.aboutDesc"]}
          </div>
        </div>
      )}

      {activeTab === "events" && (
        <>
          <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
            {created && (
              <div className="rounded-2xl border bg-green-50 p-4 text-sm text-green-800 shadow-sm">
                ✅ {dict["group.eventCreated"]}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{dict["group.eventsTitle"]}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {dict["group.eventsDesc"]}
                </div>
              </div>

              {canAdmin && (
                <Link
                  href={`/g/${group.slug}/events/new`}
                  className="rounded-xl bg-black px-4 py-2 text-sm text-white"
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
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-semibold">{dict["group.tab.members"]}</div>
          <div className="text-sm text-gray-600 mt-1">
            {dict["group.membersPrivate"]}
          </div>

          {!myId && (
            <div className="mt-3 text-sm text-gray-500">
              {dict["group.signInToJoin"]}
            </div>
          )}

          {myId && !isMember && (
            <div className="mt-3 text-sm text-gray-500">
              {dict["group.requestToSeeMembers"]}
            </div>
          )}
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
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-semibold">{dict["group.membershipRequests"]}</div>
          <div className="text-sm text-gray-600 mt-1">
            {dict["group.membershipRequestsDesc"]}
          </div>

          <div className="mt-3">
            <AdminControls groupId={groupId} requests={pendingRequests} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{dict["group.tab.members"]}</div>

          {visibility === "MEMBERS_ONLY" && (
            <div className="text-xs text-gray-500">{dict["group.visibleToMembers"]}</div>
          )}
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
                  className="flex items-center justify-between rounded-xl border px-3 py-2"
                >
                  <Link href={`/u/${m.user.username}`} className="min-w-0 hover:underline">
                    <div className="text-sm font-medium break-words">@{m.user.username}</div>
                    <div className="text-xs text-gray-500 break-words">
                      {m.role}
                      {m.showPosition && m.position ? ` · ${m.position}` : ""}
                    </div>
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">{m.user.name ?? ""}</div>

                    {canManageRoles && !isSelf && m.role !== "PRESIDENT" && (
                      <AdminMemberControls
                        groupId={groupId}
                        memberId={m.user.id}
                        currentRole={m.role}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

async function GroupEventsList({
  groupId,
  myId,
  sort,
}: {
  groupId: string;
  myId: string | null;
  sort: "soon" | "going" | "new";
}) {
  const orderBy =
    sort === "going"
      ? [{ attendees: { _count: "desc" as const } }, { startsAt: "asc" as const }]
      : sort === "new"
        ? [{ createdAt: "desc" as const }]
        : [{ startsAt: "asc" as const }];

  const events: GroupEventRow[] = await prisma.event.findMany({
    where: { groupId },
    orderBy,
    take: 50,
    include: {
      createdBy: {
        select: { username: true, name: true, image: true, emoji: true },
      },
      _count: { select: { attendees: true } },
      group: { select: { slug: true, image: true, name: true } },
      attendees: {
        orderBy: { createdAt: "desc" },
        take: 3,
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
      },
    },
  });

  if (events.length === 0) {
    return <div className="text-sm text-gray-500">No events yet.</div>;
  }

  const myGoingSet = new Set<string>();
  if (myId) {
    const rows = await prisma.eventAttendance.findMany({
      where: {
        userId: myId,
        eventId: { in: events.map((e: GroupEventRow) => e.id) },
      },
      select: { eventId: true },
    });
    rows.forEach((r: { eventId: string }) => myGoingSet.add(r.eventId));
  }

  return (
    <div className="space-y-3">
      {events.map((e: GroupEventRow) => (
        <EventCard
          key={e.id}
          event={{
            id: e.id,
            title: e.title,
            description: e.description,
            location: e.location,
            startsAtLabel: e.startsAt.toISOString().slice(0, 16).replace("T", " "),
            createdBy: e.createdBy,
            group: e.group,
            goingCount: e._count.attendees,
            goingByMe: myGoingSet.has(e.id),
            attendeesPreview: e.attendees.map((a) => a.user),
            imageUrl: e.imageUrl ?? null,
          }}
        />
      ))}
    </div>
  );
}