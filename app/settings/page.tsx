export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getDict, type Lang } from "@/lib/i18n";

type SettingsCard = {
  title: string;
  description: string;
  href: string;
  emoji: string;
  badge?: string;
};

const LANG_COOKIE = "kimepish-lang";

export default async function SettingsPage() {
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

  const SECTIONS: SettingsCard[] = [
    {
      title: dict["settings.profile.title"],
      description: dict["settings.profile.desc"],
      href: "/settings/profile",
      emoji: "👤",
    },
    {
      title: dict["settings.privacy.title"],
      description: dict["settings.privacy.desc"],
      href: "/settings/privacy",
      emoji: "🔒",
    },
    {
      title: dict["settings.groups.title"],
      description: dict["settings.groups.desc"],
      href: "/settings/groups",
      emoji: "👥",
      badge: dict["settings.groups.badge"],
    },
    {
      title: dict["settings.security.title"],
      description: dict["settings.security.desc"],
      href: "/settings/security",
      emoji: "🛡️",
    },
    {
      title: dict["settings.language.titleShort"],
      description: dict["settings.language.desc"],
      href: "/settings/language",
      emoji: "🌐",
    },
    {
      title: dict["settings.theme.titleShort"],
      description: dict["settings.theme.desc"],
      href: "/settings/theme",
      emoji: "🎨",
    },
    {
      title: dict["settings.support.title"],
      description: dict["settings.support.desc"],
      href: "/settings/support",
      emoji: "💬",
    },
  ];

  return (
    <main className="mx-auto max-w-md px-4 py-6 md:max-w-3xl space-y-6">
      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {dict["settings.title"]}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {dict["settings.subtitle"]}
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 px-3 py-2 text-sm text-gray-600">
            ⚙️ Shay
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-medium">{dict["settings.controlCenter"]}</div>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          {dict["settings.controlCenterDesc"]}
        </p>
      </section>

      <section className="space-y-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group block rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-gray-50 text-lg">
                {s.emoji}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-gray-900">{s.title}</h2>
                  {s.badge && (
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-gray-500 bg-white">
                      {s.badge}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-gray-500 break-words">{s.description}</p>
              </div>

              <div className="shrink-0 text-gray-400 transition group-hover:text-gray-700">
                →
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}