"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createEventOrRequest(input: {
  title: string;
  description: string;
  location?: string;
  startsAt: string; // ISO
  endsAt?: string; // ISO
  imageUrl?: string | null; // ✅ NEW
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) throw new Error("Unauthorized");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { id: true, isOfficial: true, isGroupAccount: true },
  });
  if (!me) throw new Error("Unauthorized");

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) throw new Error("Missing fields");

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid startsAt");

  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error("Invalid endsAt");

  const imageUrl =
    input.imageUrl && input.imageUrl.trim().length > 0 ? input.imageUrl.trim() : null;

  const canPublish = me.isOfficial || me.isGroupAccount;

  if (canPublish) {
    await prisma.event.create({
      data: {
        title,
        description,
        location: input.location?.trim() || null,
        startsAt,
        endsAt,
        createdById: me.id,
        imageUrl, // ✅ store on Event
      },
    });

    revalidatePath("/events");
    return { ok: true, published: true };
  }

  await prisma.eventRequest.create({
    data: {
      title,
      description,
      location: input.location?.trim() || null,
      startsAt,
      endsAt,
      requestedById: me.id,
      imageUrl, // ✅ store on EventRequest
    },
  });

  revalidatePath("/events/request");
  return { ok: true, published: false, requested: true };
}
