export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SecurityChangePasswordForm from "@/components/SecurityChangePasswordForm";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getDict, type Lang } from "@/lib/i18n";

const LANG_COOKIE = "kimepish-lang";

export default async function SecuritySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) return null;

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
    <main className="mx-auto max-w-md px-4 py-6 md:max-w-2xl space-y-4">
      <Link href="/settings" className="text-sm text-gray-500 hover:underline">
        {dict["settings.back"]}
      </Link>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">{dict["settings.security.title"]}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {dict["settings.security.desc"]}
        </p>
      </section>

      <SecurityChangePasswordForm />
    </main>
  );
}