"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEventOrRequest } from "@/app/actions/createEventOrRequest";
import EventImageUploader from "@/components/EventImageUploader";
import { useI18n } from "@/components/LanguageProvider";

export default function RequestEventPage() {
  const { t } = useI18n();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function onSubmit() {
    startTransition(async () => {
      await createEventOrRequest({
        title,
        description,
        location: location || undefined,
        startsAt,
        imageUrl: imageUrl || undefined,
      });

      router.push("/events");
      router.refresh();
    });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-3">
      <h1 className="text-xl font-semibold">{t("events.request.title")}</h1>

      <p className="text-sm text-gray-500">{t("events.request.subtitle")}</p>

      <EventImageUploader
        value={imageUrl}
        onChange={(next) => setImageUrl(next.url || null)}
      />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("events.form.title")}
        className="w-full rounded-xl border px-3 py-2 text-sm"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("events.form.description")}
        className="w-full rounded-xl border px-3 py-2 text-sm min-h-[120px]"
      />

      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder={t("events.form.locationOptional")}
        className="w-full rounded-xl border px-3 py-2 text-sm"
      />

      <input
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        type="datetime-local"
        className="w-full rounded-xl border px-3 py-2 text-sm"
      />

      <button
        onClick={onSubmit}
        disabled={isPending}
        className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {isPending ? t("events.request.sending") : t("events.request.send")}
      </button>
    </main>
  );
}