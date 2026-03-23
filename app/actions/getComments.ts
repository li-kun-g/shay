// app/actions/getComments.ts
"use server";

import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

type CommentRow = {
  id: string;
  content: string;
  anonymous: boolean;
  createdAt: Date;
  authorId: string;
  status: string;
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

  const comments = await prisma.comment.findMany({
    where: { 
      postId: id,
      status: PostStatus.APPROVED 
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
    // Полностью скрываем реального автора, если комментарий анонимный
    if (c.anonymous) {
      return {
        id: c.id,
        content: c.content,
        anonymous: true,
        createdAt: c.createdAt,
        authorId: "anonymous",
        author: {
          id: "anonymous",
          username: "anonymous",
          name: "Anonymous",
          emoji: "🔥",
          image: null,
        },
      };
    }

    // Возвращаем реальные данные для обычных комментариев
    return {
      id: c.id,
      content: c.content,
      anonymous: false,
      createdAt: c.createdAt,
      authorId: c.authorId,
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