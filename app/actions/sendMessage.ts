"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendMessage(input: {
  conversationId: string;
  text: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) {
    throw new Error("AUTH_REQUIRED");
  }

  const myId = session.user.id as string;
  const conversationId = input.conversationId.trim();
  const text = input.text.trim();

  if (!conversationId) throw new Error("CONVERSATION_REQUIRED");
  if (!text) throw new Error("TEXT_REQUIRED");

  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: myId,
      },
    },
    select: { id: true },
  });

  if (!member) throw new Error("FORBIDDEN");

  await prisma.message.create({
    data: {
      conversationId,
      authorId: myId,
      text,
    },
  });

  // sender has obviously read the latest state
  await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: myId,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
}