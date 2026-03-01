"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateProfileImage(url: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("id" in session.user)) {
    throw new Error("Not authenticated");
  }

  // very basic safety check
  if (!url.startsWith("http")) {
    throw new Error("Invalid image URL");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: url },
  });
}
