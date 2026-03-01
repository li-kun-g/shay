"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function approveEventRequest(requestId: string) {
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
  });

  if (!request) throw new Error("Event request not found");

  if (request.status !== "PENDING") {
    throw new Error("This request has already been processed");
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.event.create({
      data: {
        title: request.title,
        description: request.description,
        location: request.location ?? null,
        startsAt: request.startsAt,
        endsAt: request.endsAt ?? null,
        imageUrl: request.imageUrl ?? null,
        imageKey: null,
        createdById: request.requestedById,
      },
    });

    await tx.eventRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED" },
    });
  });

  revalidatePath("/admin/event-requests");
  revalidatePath("/events");
  revalidatePath("/events/request");

  return { ok: true };
}