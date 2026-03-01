export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";

import EditGroupForm from "./EditGroupForm";

const LANG_COOKIE = "kimepish-lang";

export default async function EditGroupPage(props: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const p = await Promise.resolve(props.params);
  const slug = (p?.slug ?? "").trim().toLowerCase();
  if (!slug) notFound();

  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  const lang: Lang =
    cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";
  const dict = getDict(lang);

  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/api/auth/signin");
  const myId = session.user.id as string;

  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      image: true,
      presidentId: true,
    },
  });

  if (!group) notFound();

  const isPresident = group.presidentId === myId;

  const adminRow = await prisma.groupMember.findFirst({
    where: { groupId: group.id, userId: myId, role: "ADMIN" as any },
    select: { id: true },
  });

  const isAdmin = !!adminRow;

  if (!isPresident && !isAdmin) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-4 md:max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{dict["group.editTitle"]}</h1>
        <Link
          href={`/g/${group.slug}?tab=about`}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          {dict["group.back"]}
        </Link>
      </div>

      <EditGroupForm
        slug={group.slug}
        initialName={group.name}
        initialDescription={group.description ?? ""}
        initialImage={group.image ?? ""}
      />
    </main>
  );
}