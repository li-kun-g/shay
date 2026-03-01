export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";

import FriendsList from "@/components/FriendsList";
import FriendFindList from "@/components/FriendFindList";

import {
  acceptFriendRequest,
  declineFriendRequest,
} from "@/app/actions/friends";

const LANG_COOKIE = "kimepish-lang";

type IncomingRequestRow = {
  id: string;
  from: {
    id: string;
    username: string;
  };
};

type FriendshipRow = {
  userAId: string;
  userBId: string;
  userA: {
    id: string;
    username: string;
    campusStatus: string | null;
    campusStatusExpiresAt: Date | null;
  };
  userB: {
    id: string;
    username: string;
    campusStatus: string | null;
    campusStatusExpiresAt: Date | null;
  };
};

type FriendItem = {
  id: string;
  username: string;
  campusStatus: string | null;
  campusStatusExpiresAt: Date | null;
};

export default async function FriendsPage() {
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

  const incoming: IncomingRequestRow[] = await prisma.friendRequest.findMany({
    where: { toId: myId, status: "PENDING" },
    include: { from: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  const friendships: FriendshipRow[] = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: myId }, { userBId: myId }],
    },
    include: {
      userA: {
        select: {
          id: true,
          username: true,
          campusStatus: true,
          campusStatusExpiresAt: true,
        },
      },
      userB: {
        select: {
          id: true,
          username: true,
          campusStatus: true,
          campusStatusExpiresAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends: FriendItem[] = friendships.map((f: FriendshipRow) =>
    f.userAId === myId ? f.userB : f.userA
  );

  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold">{dict["friends.title"]}</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">{dict["friends.requests"]}</h2>

        {incoming.length === 0 ? (
          <p className="text-sm text-gray-400">{dict["friends.noRequests"]}</p>
        ) : (
          incoming.map((r: IncomingRequestRow) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-sm"
            >
              <Link href={`/u/${r.from.username}`} className="font-medium">
                @{r.from.username}
              </Link>

              <div className="flex gap-2">
                <form action={acceptFriendRequest.bind(null, r.id)}>
                  <button className="text-sm px-3 py-1.5 rounded-xl bg-black text-white hover:opacity-90">
                    {dict["friends.accept"]}
                  </button>
                </form>

                <form action={declineFriendRequest.bind(null, r.id)}>
                  <button className="text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50">
                    {dict["friends.decline"]}
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">{dict["friends.myFriends"]}</h2>

        {friends.length === 0 ? (
          <p className="text-sm text-gray-400">{dict["friends.noFriendsYet"]}</p>
        ) : (
          <FriendsList friends={friends} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">{dict["friends.findPeople"]}</h2>
        <FriendFindList />
      </section>
    </main>
  );
}