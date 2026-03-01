"use client";

import { useI18n } from "@/components/LanguageProvider";
import { LANG_LABEL, type Lang } from "@/lib/i18n";

export default function LanguagePage() {
  const { lang, setLang, t, isPending } = useI18n();

  const options: Lang[] = ["EN", "RU", "KK"];

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <a href="/settings" className="text-sm hover:underline text-[color:var(--text-muted)]">
        {t("settings.back")}
      </a>

      <section className="rounded-3xl border p-5 md:p-6 k-surface k-border-strong">
        <h1 className="text-3xl font-semibold tracking-tight">{t("settings.language.title")}</h1>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
          {t("settings.language.subtitle")}
        </p>

        <div className="mt-5 rounded-3xl border p-4 k-muted k-border-strong">
          <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
            {t("settings.language.active")}
          </div>
          <div className="mt-1 text-sm">{LANG_LABEL[lang]}</div>
        </div>
      </section>

      <section className="rounded-3xl border p-5 md:p-6 k-surface k-border-strong">
        <div className="grid gap-3 md:grid-cols-3">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setLang(o)}
              disabled={isPending}
              className={[
                "rounded-3xl border p-5 text-left transition",
                "k-surface k-border-strong",
                "hover:translate-y-[-1px] active:translate-y-0",
                o === lang ? "ring-2 ring-white/80 dark:ring-white/80" : "hover:ring-1 hover:ring-white/20",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              <div className="text-base font-semibold">{LANG_LABEL[o]}</div>
              <div className="text-sm mt-1 text-[color:var(--text-muted)]">
                {o === "EN"
                  ? t("settings.language.option.en")
                  : o === "RU"
                    ? t("settings.language.option.ru")
                    : t("settings.language.option.kk")}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs text-[color:var(--text-muted)]">
          {t("settings.language.tip")}
        </div>
      </section>
    </main>
  );
}