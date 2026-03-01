"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type AttendanceRow = {
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    emoji: string;
  };
};

type Attendee = AttendanceRow["user"];

export async function getEventAttendees(eventId: string) {
  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const rows: AttendanceRow[] = await prisma.eventAttendance.findMany({
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

  const attendees: Attendee[] = rows.map((r: AttendanceRow) => r.user);

  if (!myId) return { attendees };

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

  attendees.sort((a: Attendee, b: Attendee) => {
    const af = friendIds.has(a.id) ? 1 : 0;
    const bf = friendIds.has(b.id) ? 1 : 0;
    if (af !== bf) return bf - af;
    return a.username.localeCompare(b.username);
  });

  return { attendees };
}