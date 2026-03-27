export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAccountPrivacy } from "@/app/actions/updateAccountPrivacy";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";
import SavePrivacyButton from "@/components/SavePrivacyButton";

function SelectRow(props: {
  name: string;
  title: string;
  description: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  const { name, title, description, defaultValue, options } = props;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 md:pr-4">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm text-gray-500">{description}</div>
        </div>

        <div className="shrink-0">
          <select
            name={name}
            defaultValue={defaultValue}
            className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          >
            {options.map((opt) => (
              <option key={`${name}-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const LANG_COOKIE = "kimepish-lang";

export default async function PrivacySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) return null;

  const myId = (session.user as any).id as string;

  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  let lang: Lang = cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: {
      friendsListVisibility: true,
      groupsVisibility: true,
      dmPrivacy: true,
      language: true,
    },
  });

  if (!me) return null;
  if (me.language) lang = me.language as Lang;

  const dict = getDict(lang);

  // This key forces the form to re-render with fresh data once Prisma is updated
  const formKey = `${me.friendsListVisibility}-${me.groupsVisibility}-${me.dmPrivacy}`;

  return (
    <main className="mx-auto max-w-md px-4 py-6 md:max-w-2xl space-y-4">
      <Link href="/settings" className="text-sm text-gray-500 hover:underline">
        {dict["settings.back"]}
      </Link>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">{dict["settings.privacy.title"]}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {dict["settings.privacy.pageDesc"]}
        </p>
      </section>

      {/* Added key={formKey} to keep UI in sync with Server data */}
      <form key={formKey} action={updateAccountPrivacy} className="space-y-4">
        <SelectRow
          name="friendsListVisibility"
          title={dict["settings.privacy.friendsList.title"]}
          description={dict["settings.privacy.friendsList.desc"]}
          defaultValue={me.friendsListVisibility}
          options={[
            { value: "EVERYONE", label: dict["settings.option.everyone"] },
            { value: "FRIENDS_ONLY", label: dict["settings.option.friendsOnly"] },
          ]}
        />

        <SelectRow
          name="groupsVisibility"
          title={dict["settings.privacy.groups.title"]}
          description={dict["settings.privacy.groups.desc"]}
          defaultValue={me.groupsVisibility}
          options={[
            { value: "EVERYONE", label: dict["settings.option.everyone"] },
            { value: "FRIENDS_ONLY", label: dict["settings.option.friendsOnly"] },
          ]}
        />

        <SelectRow
          name="dmPrivacy"
          title={dict["settings.privacy.dm.title"]}
          description={dict["settings.privacy.dm.desc"]}
          defaultValue={me.dmPrivacy}
          options={[
            { value: "EVERYONE", label: dict["settings.option.everyone"] },
            { value: "FRIENDS_ONLY", label: dict["settings.option.friendsOnly"] },
          ]}
        />

        <SavePrivacyButton 
          saveText={dict["settings.privacy.save"]} 
          savedText="Changes saved" 
        />
      </form>
    </main>
  );
}