import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: {
        termsAcceptedAt: new Date(),
        termsVersion: 1, // ✅ Теперь это число, ошибка исчезнет
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update terms error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}