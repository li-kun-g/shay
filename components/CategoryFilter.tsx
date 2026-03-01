"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";

export type CategoryKey = "ALL" | "GOSSIPS" | "UNI" | "CONFESSIONS" | "MARKET" | "OTHER";

export default function CategoryFilter() {
  const { t } = useI18n();

  const pathname = usePathname();
  const sp = useSearchParams();

  const raw = (sp.get("cat") ?? "ALL").toUpperCase();
  const cat: CategoryKey =
    raw === "ALL" || raw === "GOSSIPS" || raw === "UNI" || raw === "CONFESSIONS" || raw === "MARKET" || raw === "OTHER"
      ? (raw as CategoryKey)
      : "ALL";

  function hrefFor(nextCat: CategoryKey) {
    const params = new URLSearchParams(sp.toString());
    if (nextCat === "ALL") params.delete("cat");
    else params.set("cat", nextCat);
    params.delete("cursor");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const pill = (active: boolean) =>
    [
      "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm transition whitespace-nowrap",
      active
        ? "bg-black text-white border-black shadow-sm"
        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
    ].join(" ");

  const label = (k: CategoryKey) => {
    if (k === "ALL") return t("feed.all");
    if (k === "GOSSIPS") return t("cat.gossips");
    if (k === "UNI") return t("cat.uni");
    if (k === "CONFESSIONS") return t("cat.confessions");
    if (k === "MARKET") return t("cat.market");
    return t("cat.other");
  };

  const keys: CategoryKey[] = ["ALL", "GOSSIPS", "UNI", "CONFESSIONS", "MARKET", "OTHER"];

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="flex w-max min-w-full gap-2">
        {keys.map((k) => (
          <Link key={k} href={hrefFor(k)} className={pill(cat === k)}>
            {label(k)}
          </Link>
        ))}
      </div>
    </div>
  );
}