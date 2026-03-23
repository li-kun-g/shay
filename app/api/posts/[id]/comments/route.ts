export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

const TAKE = 60;

type CursorValue = { createdAt: string; id: string } | null;

function decodeCursor(cursor: string | null): CursorValue {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorValue;
  } catch {
    return null;
  }
}

function encodeCursor(obj: { createdAt: string; id: string }) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const p = await Promise.resolve(ctx.params);
  const postId = (p?.id ?? "").trim();

  if (!postId) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  const { searchParams } = new URL(req.url);
  const cursor = decodeCursor(searchParams.get("cursor"));

  // Базовое условие: только одобренные комментарии к конкретному посту
  let where: any = { 
    postId,
    status: PostStatus.APPROVED 
  };
  
  const orderBy: Array<Record<string, unknown>> = [
    { createdAt: "desc" },
    { id: "desc" },
  ];

  if (cursor?.createdAt && cursor?.id) {
    const cDate = new Date(cursor.createdAt);
    where = {
      status: PostStatus.APPROVED,
      AND: [
        { postId },
        {
          OR: [
            { createdAt: { lt: cDate } },
            { createdAt: cDate, id: { lt: cursor.id } },
          ],
        },
      ],
    };
  }

  const rows = await prisma.comment.findMany({
    where,
    orderBy,
    take: TAKE,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          emoji: true,
        },
      },
    },
  });

  const items = rows
    .slice()
    .reverse()
    .map((c) => ({
      id: c.id,
      content: c.content,
      anonymous: c.anonymous,
      createdAt: c.createdAt.toISOString(),
      authorId: c.authorId,
      author: {
        id: c.author.id,
        username: c.author.username,
        name: c.author.name,
        image: c.author.image,
        emoji: c.author.emoji,
      },
    }));

  let nextCursor: string | null = null;
  if (rows.length === TAKE) {
    const last = rows[rows.length - 1];
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    });
  }

  return NextResponse.json({ items, nextCursor });
}