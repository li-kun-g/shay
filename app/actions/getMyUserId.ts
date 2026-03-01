"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getMyUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  return me?.id ?? null;
}
