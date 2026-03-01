"use client";

import { useState } from "react";
import { useI18n } from "@/components/LanguageProvider";

export default function RequestedBanner({ show }: { show: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(show);

  if (!open) return null;

  return (
    <div className="rounded-2xl border bg-white p-4 flex items-start justify-between gap-4 shadow-sm">
      <div>
        <div className="text-sm font-semibold">{t("groups.requestSent")} ✅</div>
        <div className="text-sm text-gray-600 mt-1">
          {t("groups.requestPending.before")} <b>{t("groups.requestPending.bold")}</b>
          .
          <br />
          {t("groups.requestPending.after")}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-xl border px-2 py-1 text-sm hover:bg-gray-50"
        aria-label={t("common.close")}
      >
        ✕
      </button>
    </div>
  );
}