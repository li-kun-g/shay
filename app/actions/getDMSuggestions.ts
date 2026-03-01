// app/actions/getDmSuggestions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SuggestedUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  isFriend: boolean;
};

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export async function getDmSuggestions(input?: { q?: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user) || !session.user.id) {
    throw new Error("AUTH_REQUIRED");
  }

  const myId = session.user.id as string;
  const qRaw = (input?.q ?? "").trim();
  const q = qRaw.toLowerCase();

  // 1) friend ids (Friendship is symmetric)
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: myId }, { userBId: myId }],
    },
    select: { userAId: true, userBId: true },
  });

  const friendIds = uniq(
    friendships.map((f) => (f.userAId === myId ? f.userBId : f.userAId))
  );

  // Search filter (username startsWith > username contains > name contains)
  const matchWhere =
    q.length === 0
      ? {}
      : {
          OR: [
            { username: { startsWith: qRaw, mode: "insensitive" as const } },
            { username: { contains: qRaw, mode: "insensitive" as const } },
            { name: { contains: qRaw, mode: "insensitive" as const } },
          ],
        };

  // 2) typed query: show matches (friends first)
  if (q.length > 0) {
    const friendsMatches = friendIds.length
      ? await prisma.user.findMany({
          where: {
            id: { in: friendIds },
            ...matchWhere,
          },
          select: { id: true, username: true, name: true, image: true },
          take: 10,
          orderBy: [{ username: "asc" }],
        })
      : [];

    const friendMatchIds = friendsMatches.map((u) => u.id);

    const otherMatches = await prisma.user.findMany({
      where: {
        id: { notIn: [myId, ...friendIds, ...friendMatchIds] },
        ...matchWhere,
      },
      select: { id: true, username: true, name: true, image: true },
      take: 10,
      orderBy: [{ username: "asc" }],
    });

    return [
      ...friendsMatches.map((u) => ({ ...u, isFriend: true })),
      ...otherMatches.map((u) => ({ ...u, isFriend: false })),
    ] as SuggestedUser[];
  }

  // 3) empty query: friends or fallback to popular users
  if (friendIds.length > 0) {
    const friends = await prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: { id: true, username: true, name: true, image: true },
      take: 12,
      orderBy: [{ username: "asc" }],
    });

    return friends.map((u) => ({ ...u, isFriend: true })) as SuggestedUser[];
  }

    // --- No friends -> popular users (many friends)

  const aCounts = await prisma.friendship.groupBy({
    by: ["userAId"],
    _count: { userAId: true },
    orderBy: { _count: { userAId: "desc" } },
    take: 200,
  });

  const bCounts = await prisma.friendship.groupBy({
    by: ["userBId"],
    _count: { userBId: true },
    orderBy: { _count: { userBId: "desc" } },
    take: 200,
  });

  const counts = new Map<string, number>();

  for (const r of aCounts) {
    counts.set(r.userAId, (counts.get(r.userAId) ?? 0) + r._count.userAId);
  }
  for (const r of bCounts) {
    counts.set(r.userBId, (counts.get(r.userBId) ?? 0) + r._count.userBId);
  }

  const popularIds = Array.from(counts.entries())
    .filter(([id]) => id !== myId)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([id]) => id);

  if (popularIds.length === 0) return [];

  const popularUsers = await prisma.user.findMany({
    where: { id: { in: popularIds } },
    select: { id: true, username: true, name: true, image: true },
  });

  // keep popularity order
  const byId = new Map(popularUsers.map((u) => [u.id, u]));
  const ordered = popularIds.map((id) => byId.get(id)).filter(Boolean) as typeof popularUsers;

  return ordered.map((u) => ({ ...u, isFriend: false })) as SuggestedUser[];}
