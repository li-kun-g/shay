export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import SpillComposer from "@/components/SpillComposer";
import CampusStatusBlock from "@/components/CampusStatusBlock";
import ProfileActions from "@/components/ProfileActions";
import ProfilePostsInfiniteList from "@/components/ProfilePostsInfiniteList";
import ProfileFriendsInfiniteList from "@/components/ProfileFriendsInfiniteList";
import ProfileGroupsInfiniteList from "@/components/ProfileGroupsInfiniteList";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";

type Params = { username: string };
type SP = { tab?: string };
type CampusStatus = "ON" | "OFF" | null;
type ProfileTab = "posts" | "friends" | "groups";
type ProfileVisibility = "EVERYONE" | "FRIENDS_ONLY";

type UserWithProfileStuff = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  emoji: string;
  status: string | null;
  major: string | null;
  college: string;
  kimepId: number | null;
  yearOfStudy: number | null;

  campusStatus: "ON" | "OFF" | null;
  campusStatusUpdatedAt: Date | null;
  campusStatusExpiresAt: Date | null;
  campusStatusVisibility: string;

  badges: {
    id: string;
    name: string;
    emoji: string;
    userId: string;
  }[];

  friendsListVisibility: ProfileVisibility;
  groupsVisibility: ProfileVisibility;
  dmPrivacy: string;

  _count: { posts: number };
};

const LANG_COOKIE = "kimepish-lang";

function computeCampusDisplay(input: {
  status: CampusStatus;
  updatedAt: Date | null;
  expiresAt: Date | null;
}) {
  const now = Date.now();

  if (input.expiresAt && input.expiresAt.getTime() <= now) {
    return {
      status: null as CampusStatus,
      updatedAt: null as Date | null,
    };
  }

  return {
    status: input.status,
    updatedAt: input.updatedAt,
  };
}

function parseTab(v?: string): ProfileTab {
  if (v === "friends" || v === "groups" || v === "posts") return v;
  return "posts";
}

function StatLink({
  href,
  value,
  label,
  active,
}: {
  href: string;
  value: number;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-xl border p-2 text-center text-sm transition",
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50",
      ].join(" ")}
    >
      <div className="font-semibold">{value}</div>
      <div className={active ? "text-white/80" : "text-gray-500"}>{label}</div>
    </Link>
  );
}

function LockedCard(props: { title: string; subtitle: string }) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-base font-semibold">{props.title}</div>
      <div className="mt-1 text-sm text-gray-500">{props.subtitle}</div>
    </section>
  );
}

function canViewerSee(
  visibility: ProfileVisibility,
  isMe: boolean,
  isFriend: boolean
) {
  if (isMe) return true;
  if (visibility === "EVERYONE") return true;
  return isFriend;
}

export default async function UserPage(props: {
  params: Params | Promise<Params>;
  searchParams?: SP | Promise<SP>;
}) {
  const p = await Promise.resolve(props.params);
  const sp = await Promise.resolve(props.searchParams);

  const username = (p?.username ?? "").trim().toLowerCase();
  if (!username) notFound();

  const activeTab = parseTab(sp?.tab);

  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  const lang: Lang =
    cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";
  const dict = getDict(lang);

  const session = await getServerSession(authOptions);
  const myUserId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const user = (await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      emoji: true,
      status: true,
      major: true,
      college: true,
      kimepId: true,
      yearOfStudy: true,

      campusStatus: true,
      campusStatusUpdatedAt: true,
      campusStatusExpiresAt: true,
      campusStatusVisibility: true,

      badges: true,

      friendsListVisibility: true,
      groupsVisibility: true,
      dmPrivacy: true,

      _count: { select: { posts: true } },
    },
  })) as UserWithProfileStuff | null;

  if (!user) notFound();

  const isMe = !!myUserId && myUserId === user.id;

  const viewerIsFriend =
    !!myUserId && !isMe
      ? !!(await prisma.friendship.findFirst({
          where: {
            OR: [
              { userAId: myUserId, userBId: user.id },
              { userAId: user.id, userBId: myUserId },
            ],
          },
          select: { id: true },
        }))
      : false;

  const canSeeFriends = canViewerSee(
    user.friendsListVisibility,
    isMe,
    viewerIsFriend
  );
  const canSeeGroups = canViewerSee(
    user.groupsVisibility,
    isMe,
    viewerIsFriend
  );

  const campus = computeCampusDisplay({
    status: (user.campusStatus ?? null) as CampusStatus,
    updatedAt: (user.campusStatusUpdatedAt ?? null) as Date | null,
    expiresAt: (user.campusStatusExpiresAt ?? null) as Date | null,
  });

  const showCampusToViewer = campus.status !== null;

  const friendsCount = await prisma.friendship.count({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
  });

  const [presidentGroupsForCount, memberGroupsForCount] = await Promise.all([
    prisma.group.findMany({
      where: { presidentId: user.id, status: "APPROVED" },
      select: { id: true },
    }),
    prisma.groupMember.findMany({
      where: { userId: user.id, group: { status: "APPROVED" } },
      select: { groupId: true },
    }),
  ]);

  const groupIdsCount = new Set<string>();
  for (const g of presidentGroupsForCount) groupIdsCount.add(g.id);
  for (const m of memberGroupsForCount) groupIdsCount.add(m.groupId);
  const groupsCount = groupIdsCount.size;

  const baseProfilePath = `/u/${encodeURIComponent(user.username)}`;
  const tabHref = (tab: ProfileTab) =>
    tab === "posts" ? baseProfilePath : `${baseProfilePath}?tab=${tab}`;

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-6">
      <div className="rounded-2xl border bg-white p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border bg-gray-100 overflow-hidden flex-shrink-0">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={dict["profile.alt"]}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl">
                {user.emoji}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold leading-tight break-words">
              @{user.username}
            </h1>

            <p className="text-sm text-gray-700 leading-tight">
              {user.name ?? dict["profile.student"]}
            </p>

            {user.status && (
              <p className="text-sm text-gray-600 mt-1 break-words">{user.status}</p>
            )}

            {!isMe && myUserId && (
              <ProfileActions profileUserId={user.id} profileUsername={user.username} />
            )}

            <p className="text-sm text-gray-500 mt-2 break-words">
              {(user.major ?? dict["profile.undeclared"])} · {user.college}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {user.kimepId ? `KIMEP ${user.kimepId}` : "KIMEP —"} ·{" "}
              {user.yearOfStudy
                ? `${dict["profile.year"]} ${user.yearOfStudy}`
                : `${dict["profile.year"]} —`}
            </p>

            {!isMe && showCampusToViewer && (
              <div className="mt-2">
                <CampusStatusBlock
                  editable={false}
                  initialStatus={campus.status}
                  initialUpdatedAt={campus.updatedAt ? campus.updatedAt.toISOString() : null}
                  showFreshness={true}
                />
              </div>
            )}

            {isMe && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <a
                  href="/settings/profile"
                  className="inline-flex justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {dict["profile.editProfile"]}
                </a>

                <CampusStatusBlock
                  editable={true}
                  initialStatus={campus.status}
                  initialUpdatedAt={campus.updatedAt ? campus.updatedAt.toISOString() : null}
                  showFreshness={false}
                />
              </div>
            )}
          </div>
        </div>

        {user.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {user.badges.map((b) => (
              <span key={b.id} className="rounded-full border px-3 py-1 text-xs bg-gray-50">
                {b.emoji} {b.name}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <StatLink
            href={tabHref("posts")}
            value={user._count.posts}
            label={dict["profile.posts"]}
            active={activeTab === "posts"}
          />
          <StatLink
            href={tabHref("friends")}
            value={friendsCount}
            label={dict["friends.title"]}
            active={activeTab === "friends"}
          />
          <StatLink
            href={tabHref("groups")}
            value={groupsCount}
            label={dict["groups.title"]}
            active={activeTab === "groups"}
          />
        </div>
      </div>

      {activeTab === "posts" && (
        <>
          {isMe && <SpillComposer />}
          <ProfilePostsInfiniteList username={user.username} myUserId={myUserId} />
        </>
      )}

      {activeTab === "friends" &&
        (canSeeFriends ? (
          <ProfileFriendsInfiniteList username={user.username} />
        ) : (
          <LockedCard
            title={dict["profile.friendsPrivate"]}
            subtitle={dict["profile.onlyFriendsCanView"]}
          />
        ))}

      {activeTab === "groups" &&
        (canSeeGroups ? (
          <ProfileGroupsInfiniteList username={user.username} />
        ) : (
          <LockedCard
            title={dict["profile.groupsPrivate"]}
            subtitle={dict["profile.onlyFriendsCanView"]}
          />
        ))}
    </main>
  );
}