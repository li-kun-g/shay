"use server";

import { prisma } from "@/lib/prisma";

type CommentRow = {
  id: string;
  content: string;
  anonymous: boolean;
  createdAt: Date;
  authorId: string;
  author: {
    id: string;
    username: string;
    name: string | null;
    emoji: string;
    image: string | null;
  };
};

export async function getComments(postId: string) {
  const id = (postId ?? "").trim();
  if (!id) return [];

  const comments: CommentRow[] = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          emoji: true,
          image: true,
        },
      },
    },
  });

  return comments.map((c: CommentRow) => ({
    id: c.id,
    content: c.content,
    anonymous: c.anonymous,
    createdAt: c.createdAt,
    authorId: c.authorId,
    author: {
      id: c.author.id,
      username: c.author.username,
      name: c.author.name,
      emoji: c.author.emoji,
      image: c.author.image,
    },
  }));
}