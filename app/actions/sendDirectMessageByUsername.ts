"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendDirectMessageByUsername(input: {
  username: string;
  text: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) {
    throw new Error("AUTH_REQUIRED");
  }

  const myId = session.user.id as string;
  const username = input.username.trim().replace(/^@+/, "").toLowerCase();
  const text = input.text.trim();

  if (!username) throw new Error("USER_NOT_FOUND");
  if (!text) throw new Error("EMPTY_MESSAGE");

  const target = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      dmPrivacy: true,
    },
  });

  if (!target) throw new Error("USER_NOT_FOUND");
  if (target.id === myId) throw new Error("CANNOT_DM_SELF");

  if (target.dmPrivacy === "FRIENDS_ONLY") {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: myId, userBId: target.id },
          { userAId: target.id, userBId: myId },
        ],
      },
      select: { id: true },
    });

    if (!friendship) throw new Error("DM_FRIENDS_ONLY");
  }

  const dmKey = [myId, target.id].sort().join(":");

  let convo = await prisma.conversation.findUnique({
    where: { dmKey },
    select: { id: true },
  });

  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        dmKey,
        members: {
          create: [
            { userId: myId, lastReadAt: new Date() },
            { userId: target.id, lastReadAt: null },
          ],
        },
      },
      select: { id: true },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      authorId: myId,
      text,
    },
  });

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId: convo.id,
        userId: myId,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${convo.id}`);

  return { conversationId: convo.id };
}