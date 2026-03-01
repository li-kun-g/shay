"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PostCategory } from "@prisma/client";

export async function createPost(input: {
  content: string;
  anonymous: boolean;
  category: PostCategory;
  imageUrl?: string | null;
  imageKey?: string | null;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new Error("AUTH_REQUIRED");
  }

  const content = (input.content ?? "").trim();
  const imageUrl = (input.imageUrl ?? null) ? String(input.imageUrl).trim() : null;
  const imageKey = (input.imageKey ?? null) ? String(input.imageKey).trim() : null;

  // must have something
  if (!content && !imageUrl) return;

  // enforce max len (matches UI)
  if (content.length > 280) throw new Error("CONTENT_TOO_LONG");

  // ✅ rule: anonymous posts cannot have images
  if (input.anonymous && imageUrl) {
    throw new Error("ANON_CANNOT_HAVE_IMAGE");
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!me) throw new Error("AUTH_REQUIRED");

  await prisma.post.create({
    data: {
      content,
      anonymous: input.anonymous,
      category: input.category,
      authorId: me.id,
      imageUrl,
      imageKey,
    },
  });

  revalidatePath("/");
}