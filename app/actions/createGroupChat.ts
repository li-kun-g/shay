"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createGroupChat(input: {
  name: string;
  usernames: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) {
    redirect("/signin");
  }

  const myId = session.user.id as string;
  const name = input.name.trim();

  if (!name) throw new Error("GROUP_NAME_REQUIRED");

  const usernames = input.usernames
    .split(",")
    .map((x) => x.trim().replace(/^@+/, "").toLowerCase())
    .filter(Boolean);

  const uniqueUsernames = Array.from(new Set(usernames));

  // creator + selected users <= 150
  if (uniqueUsernames.length + 1 > 150) {
    throw new Error("GROUP_MEMBER_LIMIT");
  }

  const users = uniqueUsernames.length
    ? await prisma.user.findMany({
        where: { username: { in: uniqueUsernames } },
        select: { id: true },
      })
    : [];

  const memberIds = Array.from(new Set([myId, ...users.map((u) => u.id)]));

  if (memberIds.length > 150) {
    throw new Error("GROUP_MEMBER_LIMIT");
  }

  const now = new Date();

  const convo = await prisma.conversation.create({
    data: {
      type: "GROUP",
      name,
      members: {
        create: memberIds.map((userId) => ({
          userId,
          lastReadAt: userId === myId ? now : null,
        })),
      },
    },
    select: { id: true },
  });

  redirect(`/messages/${convo.id}`);
}