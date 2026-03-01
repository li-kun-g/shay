"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function rejectEventRequest(requestId: string) {
  const session = await getServerSession(authOptions);
  const userId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!userId) throw new Error("Unauthorized");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isOfficial: true },
  });

  if (!me) throw new Error("Unauthorized");
  if (!me.isOfficial) throw new Error("Forbidden");

  const request = await prisma.eventRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });

  if (!request) throw new Error("Event request not found");

  if (request.status !== "PENDING") {
    throw new Error("This request has already been processed");
  }

  await prisma.eventRequest.update({
    where: { id: request.id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin/event-requests");
  revalidatePath("/events/request");
}