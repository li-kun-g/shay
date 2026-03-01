export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TAKE = 60;

function decodeCursor(cursor: string | null): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
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

  let where: any = { postId };
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

  if (cursor?.createdAt && cursor?.id) {
    const cDate = new Date(cursor.createdAt);
    where = {
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
          username: true, // ✅ IMPORTANT
          name: true,
          image: true,
          emoji: true,
        },
      },
    },
  });

  // Return oldest->newest for nice reading inside each page chunk
  const items = rows
    .slice()
    .reverse()
    .map((c) => ({
      id: c.id,
      content: c.content,
      anonymous: c.anonymous,
      createdAt:
        c.createdAt instanceof Date ? c.createdAt.toISOString() : (c.createdAt as any),
      authorId: c.authorId,
      author: {
        id: c.author.id,
        username: c.author.username, // ✅ IMPORTANT
        name: c.author.name,
        image: c.author.image,
        emoji: c.author.emoji,
      },
    }));

  let nextCursor: string | null = null;
  if (rows.length === TAKE) {
    const last = rows[rows.length - 1]; // oldest row in this DESC page
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    });
  }

  return NextResponse.json({ items, nextCursor });
}