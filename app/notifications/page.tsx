export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationsList from "@/components/NotificationsList";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

const LANG_COOKIE = "kimepish-lang";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("id" in session.user)) {
    redirect("/signin");
  }

  const myId = session.user.id as string;

  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  let lang: Lang = cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { language: true },
  });

  if (me?.language) lang = me.language as Lang;

  const dict = getDict(lang);

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{dict["notifications.title"]}</h1>
            <p className="text-sm text-gray-500">{dict["notifications.subtitle"]}</p>
          </div>
        </div>
      </section>

      <NotificationsList />
    </main>
  );
}