"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleGoing(eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  const existing = await prisma.eventAttendance.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.eventAttendance.delete({
      where: { eventId_userId: { eventId, userId } },
    });
  } else {
    await prisma.eventAttendance.create({
      data: { eventId, userId },
    });
  }

  revalidatePath("/events");
  return { ok: true };
}
