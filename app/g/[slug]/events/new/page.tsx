export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GroupEventForm from "./ui";

type Params = { slug: string };

export default async function NewGroupEventPage(props: {
  params: Params | Promise<Params>;
}) {
  const p = await Promise.resolve(props.params);
  const slug = (p?.slug ?? "").trim().toLowerCase();
  if (!slug) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/signin");
  const myId = session.user.id as string;

  const group = await prisma.group.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, status: true },
  });

  if (!group || group.status !== "APPROVED") notFound();

  // Only PRESIDENT/ADMIN can create events
  const me = await prisma.groupMember.findFirst({
    where: { groupId: group.id, userId: myId },
    select: { role: true },
  });

  const canCreate = !!me && (me.role === "PRESIDENT" || me.role === "ADMIN");
  if (!canCreate) notFound();

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
        <div className="text-sm text-gray-500">Create event for</div>
        <div className="text-2xl font-semibold mt-1">{group.name}</div>
        <div className="text-sm text-gray-500 mt-1">@{group.slug}</div>

        <div className="mt-3">
          <Link href={`/g/${group.slug}?tab=events`} className="text-sm underline">
            ← Back to group events
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
        {/* ✅ GroupEventForm now handles optional image upload */}
        <GroupEventForm groupId={group.id} groupSlug={group.slug} />
      </div>
    </main>
  );
}
