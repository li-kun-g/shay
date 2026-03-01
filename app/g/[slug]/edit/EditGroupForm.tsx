"use client";

import { useState } from "react";
import { updateGroup } from "@/app/actions/updateGroup";
import AvatarUploader from "@/components/AvatarUploader";
import { useI18n } from "@/components/LanguageProvider";

export default function EditGroupForm(props: {
  slug: string;
  initialName: string;
  initialDescription: string;
  initialImage: string;
}) {
  const { t } = useI18n();
  const { slug, initialName, initialDescription, initialImage } = props;

  const [image, setImage] = useState<string>(initialImage);

  return (
    <form
      action={updateGroup.bind(null, slug)}
      className="rounded-2xl border bg-white p-4 shadow-sm space-y-4"
    >
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-medium mb-3">{t("group.avatar")}</div>

        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-gray-100">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={t("group.avatarAlt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                {t("group.noPhoto")}
              </div>
            )}
          </div>

          <div className="flex-1">
            <AvatarUploader
              endpoint="groupImage"
              onUploaded={(url) => {
                setImage(url);
              }}
            />
            <div className="mt-2 text-xs text-gray-400">
              {t("group.avatarTip")}
            </div>
          </div>
        </div>
      </div>

      <input type="hidden" name="image" value={image} />

      <div className="space-y-1">
        <label className="text-sm font-medium">{t("group.form.nameLabel")}</label>
        <input
          name="name"
          defaultValue={initialName}
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder={t("group.form.namePlaceholder")}
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t("group.form.descLabel")}</label>
        <textarea
          name="description"
          defaultValue={initialDescription}
          className="w-full min-h-[110px] resize-none rounded-xl border px-3 py-2 text-sm"
          placeholder={t("group.form.descPlaceholder")}
          maxLength={280}
        />
      </div>

      <button className="w-full rounded-xl bg-black px-4 py-3 text-sm text-white">
        {t("settings.profile.saveChanges")}
      </button>
    </form>
  );
}