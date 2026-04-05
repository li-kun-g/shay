"use server";

import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

export async function getComments(postId: string) {
  const id = (postId ?? "").trim();
  if (!id) return [];

  const comments = await prisma.comment.findMany({
    where: {
      postId: id,
      status: PostStatus.APPROVED,
    },
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

  return comments.map((c) => {
    if (c.anonymous) {
      return {
        id: c.id,
        content: c.content,
        anonymous: true,
        createdAt: c.createdAt,
        authorId: "anonymous",
        giphyId: c.giphyId,
        giphyTitle: c.giphyTitle,
        author: {
          id: "anonymous",
          username: "anonymous",
          name: "Anonymous",
          emoji: "🔥",
          image: null,
        },
      };
    }

    return {
      id: c.id,
      content: c.content,
      anonymous: false,
      createdAt: c.createdAt,
      authorId: c.authorId,
      giphyId: c.giphyId,
      giphyTitle: c.giphyTitle,
      author: {
        id: c.author.id,
        username: c.author.username,
        name: c.author.name,
        emoji: c.author.emoji,
        image: c.author.image,
      },
    };
  });
}