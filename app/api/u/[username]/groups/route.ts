export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TAKE = 12;

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

async function viewerIsFriend(viewerId: string, ownerId: string) {
  const f = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: viewerId, userBId: ownerId },
        { userAId: ownerId, userBId: viewerId },
      ],
    },
    select: { id: true },
  });
  return !!f;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ username: string }> | { username: string } }
) {
  const params = await Promise.resolve(ctx.params);
  const username = (params?.username ?? "").trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 400 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const session = await getServerSession(authOptions);
  const viewerId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const owner = await prisma.user.findUnique({
    where: { username },
    select: { id: true, groupsVisibility: true },
  });

  if (!owner) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 404 });
  }

  // ✅ Privacy enforcement
  const isMe = !!viewerId && viewerId === owner.id;
  if (!isMe && owner.groupsVisibility === "FRIENDS_ONLY") {
    if (!viewerId) {
      return NextResponse.json({ items: [], nextCursor: null }, { status: 403 });
    }
    const ok = await viewerIsFriend(viewerId, owner.id);
    if (!ok) {
      return NextResponse.json({ items: [], nextCursor: null }, { status: 403 });
    }
  }

  const where: any = {
    status: "APPROVED",
    OR: [{ presidentId: owner.id }, { members: { some: { userId: owner.id } } }],
  };

  if (q) {
    where.AND = [
      {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      },
    ];
  }

  if (cursor?.createdAt && cursor?.id) {
    const cDate = new Date(cursor.createdAt);
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: [
          { createdAt: { lt: cDate } },
          { createdAt: cDate, id: { lt: cursor.id } },
        ],
      },
    ];
  }

  const groups = await prisma.group.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: TAKE,
    distinct: ["id"],
    select: {
      id: true,
      slug: true,
      name: true,
      image: true,
      description: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  });

  const items = groups.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    image: g.image,
    description: g.description,
    membersCount: g._count.members,
  }));

  let nextCursor: string | null = null;
  if (groups.length === TAKE) {
    const last = groups[groups.length - 1];
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    });
  }

  return NextResponse.json({ items, nextCursor });
}