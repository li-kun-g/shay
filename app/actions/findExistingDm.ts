"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function findExistingDm(username: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) {
    throw new Error("AUTH_REQUIRED");
  }

  const myId = session.user.id as string;
  const normalized = username.trim().replace(/^@+/, "").toLowerCase();

  if (!normalized) throw new Error("USER_NOT_FOUND");

  const target = await prisma.user.findUnique({
    where: { username: normalized },
    select: { id: true },
  });

  if (!target) throw new Error("USER_NOT_FOUND");
  if (target.id === myId) throw new Error("CANNOT_DM_SELF");

  const dmKey = [myId, target.id].sort().join(":");

  const convo = await prisma.conversation.findUnique({
    where: { dmKey },
    select: { id: true },
  });

  return {
    exists: !!convo,
    conversationId: convo?.id ?? null,
  };
}