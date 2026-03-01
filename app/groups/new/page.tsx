"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroupAction } from "@/app/actions/groups";
import { useI18n } from "@/components/LanguageProvider";

export default function NewGroupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createGroupAction(fd);
      router.push(`/g/${res.slug}`);
      router.refresh();
    });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold">{t("groups.createTitle")}</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="name"
          placeholder={t("groups.create.name")}
          className="w-full rounded-xl border px-3 py-2 text-sm"
          required
          maxLength={60}
        />

        <textarea
          name="description"
          placeholder={t("groups.create.description")}
          className="w-full rounded-xl border px-3 py-2 text-sm"
          rows={3}
          maxLength={200}
        />

        <select
          name="visibility"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          defaultValue="PUBLIC"
        >
          <option value="PUBLIC">{t("groups.create.public")}</option>
          <option value="PRIVATE">{t("groups.create.private")}</option>
        </select>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? t("groups.creating") : t("groups.create")}
        </button>
      </form>
    </main>
  );
}