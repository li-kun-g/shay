"use client";

import { useFormStatus } from "react-dom";
import { useI18n } from "@/components/LanguageProvider";

export default function SubmitButton() {
  const { t } = useI18n();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-black px-4 py-2.5 text-sm text-white disabled:opacity-50"
    >
      {pending ? t("groups.sending") : t("groups.sendRequest")}
    </button>
  );
}