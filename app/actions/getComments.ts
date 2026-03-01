"use server";

import { prisma } from "@/lib/prisma";

export async function getComments(postId: string) {
  const id = (postId ?? "").trim();
  if (!id) return [];

  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: {
          id: true,
          username: true, // ✅ IMPORTANT
          name: true,
          emoji: true,
          image: true,
        },
      },
    },
  });

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    anonymous: c.anonymous,
    createdAt: c.createdAt,
    authorId: c.authorId,
    author: {
      id: c.author.id,
      username: c.author.username, // ✅ IMPORTANT
      name: c.author.name,
      emoji: c.author.emoji,
      image: c.author.image,
    },
  }));
}