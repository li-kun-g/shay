export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const myUserId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!myUserId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const id = typeof body?.id === "string" ? body.id : null;
  const all = !!body?.all;

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: myUserId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { id, userId: myUserId },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}