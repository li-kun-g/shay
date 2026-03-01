// app/actions/openDm.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ConversationType } from "@prisma/client";

function pickDmType(): ConversationType {
  const values = Object.values(ConversationType) as string[];

  const match =
    values.find((v) => v.toLowerCase() === "dm") ??
    values.find((v) => v.toLowerCase().includes("direct")) ??
    values.find((v) => v.toLowerCase().includes("private")) ??
    values.find((v) => v.toLowerCase().includes("one")) ??
    values[0];

  return match as ConversationType;
}

const DM_TYPE = pickDmType();

async function areFriends(a: string, b: string) {
  const f = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: a, userBId: b },
        { userAId: b, userBId: a },
      ],
    },
    select: { id: true },
  });
  return !!f;
}

export async function openDm(toUsername: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user) || !session.user.id) {
    throw new Error("AUTH_REQUIRED");
  }

  const myId = session.user.id as string;
  const username = (toUsername || "").trim().toLowerCase();
  if (!username) throw new Error("USERNAME_REQUIRED");

  const other = await prisma.user.findUnique({
    where: { username },
    select: { id: true, dmPrivacy: true },
  });

  if (!other) throw new Error("USER_NOT_FOUND");
  if (other.id === myId) throw new Error("CANNOT_DM_SELF");

  // ✅ DM privacy enforcement
  if (other.dmPrivacy === "FRIENDS_ONLY") {
    const ok = await areFriends(myId, other.id);
    if (!ok) throw new Error("DM_FRIENDS_ONLY");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      type: DM_TYPE,
      members: { some: { userId: myId } },
      AND: [{ members: { some: { userId: other.id } } }],
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return { conversationId: existing.id };

  const convo = await prisma.conversation.create({
    data: {
      type: DM_TYPE,
      members: {
        create: [{ userId: myId }, { userId: other.id }],
      },
    },
    select: { id: true },
  });

  return { conversationId: convo.id };
}