"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";

type AnonKey = "all" | "anon" | "non";

export default function AnonFilter() {
  const { t } = useI18n();

  const pathname = usePathname();
  const sp = useSearchParams();

  const raw = (sp.get("anon") ?? "all").toLowerCase();
  const current: AnonKey = raw === "anon" || raw === "non" || raw === "all" ? (raw as AnonKey) : "all";

  function hrefFor(next: AnonKey) {
    const params = new URLSearchParams(sp.toString());
    if (next === "all") params.delete("anon");
    else params.set("anon", next);
    params.delete("cursor");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const btn = (k: AnonKey) =>
    [
      "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition",
      current === k ? "bg-black text-white shadow-sm" : "text-gray-700 hover:bg-gray-100",
    ].join(" ");

  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
      <Link href={hrefFor("all")} className={btn("all")}>
        {t("feed.all")}
      </Link>
      <Link href={hrefFor("anon")} className={btn("anon")}>
        {t("feed.anon")}
      </Link>
      <Link href={hrefFor("non")} className={btn("non")}>
        {t("feed.nonAnon")}
      </Link>
    </div>
  );
}