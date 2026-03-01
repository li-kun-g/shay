"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEventOrRequest } from "@/app/actions/createEventOrRequest";
import { useUploadThing } from "@/lib/uploadthing";
import { useI18n } from "@/components/LanguageProvider";

export default function NewEventPage() {
  const { t } = useI18n();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");

  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("eventImage", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) setImageUrl(url);
      setUploading(false);
    },
    onUploadError: (err) => {
      setUploading(false);
      alert(err.message);
    },
  });

  async function onPickFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    await startUpload([file]);
  }

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

  const busy = isPending || uploading;

  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-3">
      <h1 className="text-xl font-semibold">{t("events.new.title")}</h1>

      <div className="rounded-2xl border bg-white p-3 space-y-2">
        <div className="text-sm font-medium">{t("events.new.imageOptional")}</div>

        {imageUrl ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={t("events.imageAlt")}
              className="w-full rounded-xl border object-cover max-h-64"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50"
              >
                {t("events.new.removeImage")}
              </button>

              <label className="text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50 cursor-pointer">
                {t("events.new.changeImage")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  disabled={busy}
                />
              </label>

              {uploading && <span className="text-xs text-gray-500">{t("events.new.uploading")}</span>}
            </div>
          </div>
        ) : (
          <label className="inline-flex items-center justify-center w-full rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">
            {uploading ? t("events.new.uploading") : t("events.new.uploadImage")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              disabled={busy}
            />
          </label>
        )}

        <div className="text-xs text-gray-500">{t("events.new.imageHint")}</div>
      </div>

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
        disabled={busy}
        className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? t("events.new.saving") : t("events.new.publish")}
      </button>
    </main>
  );
}