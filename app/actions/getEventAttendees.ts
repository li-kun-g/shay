"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getEventAttendees(eventId: string) {
  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const rows = await prisma.eventAttendance.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
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
  });

  const attendees = rows.map((r) => r.user);

  // If not logged in → no friends sort, just return
  if (!myId) return { attendees };

  // Friends of me (Friendship is undirected A/B)
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: myId }, { userBId: myId }],
    },
    select: { userAId: true, userBId: true },
  });

  const friendIds = new Set<string>();
  for (const f of friendships) {
    friendIds.add(f.userAId === myId ? f.userBId : f.userAId);
  }

  attendees.sort((a, b) => {
    const af = friendIds.has(a.id) ? 1 : 0;
    const bf = friendIds.has(b.id) ? 1 : 0;
    if (af !== bf) return bf - af; // friends first
    return a.username.localeCompare(b.username);
  });

  return { attendees };
}
