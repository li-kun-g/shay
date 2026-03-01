export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const myUserId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!myUserId) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  const count = await prisma.notification.count({
    where: { userId: myUserId, isRead: false },
  });

  return NextResponse.json({ count });
}