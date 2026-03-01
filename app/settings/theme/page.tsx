"use client";

import Link from "next/link";
import { useTheme, type ThemeMode } from "@/components/ThemeProvider";
import { useI18n } from "@/components/LanguageProvider";

function Card(props: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={[
        "rounded-3xl border p-5 md:p-6",
        "k-surface",
        "k-border-strong",
        props.className ?? "",
      ].join(" ")}
    >
      {props.children}
    </section>
  );
}

function OptionCard(props: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  const { active, onClick, title, subtitle } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-3xl border p-5 transition",
        "k-surface",
        "k-border-strong",
        "hover:translate-y-[-1px] active:translate-y-0",
        "focus:outline-none",
        active
          ? "ring-2 ring-white/90 dark:ring-white/80"
          : "hover:ring-1 hover:ring-white/20",
      ].join(" ")}
    >
      <div className="text-base font-semibold tracking-tight">{title}</div>
      <div className="text-sm mt-1 text-[color:var(--text-muted)]">{subtitle}</div>
    </button>
  );
}

export default function ThemePage() {
  const { t } = useI18n();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const options: { key: ThemeMode; title: string; subtitle: string }[] = [
    {
      key: "light",
      title: t("settings.theme.light"),
      subtitle: t("settings.theme.lightDesc"),
    },
    {
      key: "dark",
      title: t("settings.theme.dark"),
      subtitle: t("settings.theme.darkDesc"),
    },
    {
      key: "system",
      title: t("settings.theme.system"),
      subtitle: t("settings.theme.systemDesc"),
    },
  ];

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <Link
        href="/settings"
        className="text-sm hover:underline text-[color:var(--text-muted)]"
      >
        {t("settings.back")}
      </Link>

      <Card>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("settings.theme.title")}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
          {t("settings.theme.pageDesc")}
        </p>

        <div className="mt-5 rounded-3xl border p-4 k-muted k-border-strong">
          <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
            {t("settings.language.active")}
          </div>
          <div className="mt-1 text-sm">
            {theme === "system"
              ? `${t("settings.theme.system")} (${resolvedTheme === "dark" ? t("settings.theme.dark") : t("settings.theme.light")})`
              : theme === "dark"
                ? t("settings.theme.dark")
                : t("settings.theme.light")}
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">{t("settings.theme.appearance")}</div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {options.map((o) => (
            <OptionCard
              key={o.key}
              active={theme === o.key}
              onClick={() => setTheme(o.key)}
              title={o.title}
              subtitle={o.subtitle}
            />
          ))}
        </div>

        <div className="mt-4 text-xs text-[color:var(--text-muted)]">
          {t("settings.theme.tip")}
        </div>
      </Card>
    </main>
  );
}