export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CampusRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { username: true },
  });

  if (!me?.username) redirect("/");

  redirect(`/u/${me.username}`);
}
