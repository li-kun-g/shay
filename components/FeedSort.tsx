"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";

export default function FeedSort() {
  const { t } = useI18n();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") === "top" ? "top" : "latest";

  function href(nextSort: "latest" | "top") {
    const sp = new URLSearchParams(searchParams.toString());
    if (nextSort === "latest") sp.delete("sort");
    else sp.set("sort", "top");
    sp.delete("cursor");
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const tabClass = (active: boolean) =>
    [
      "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
      active ? "bg-black text-white shadow-sm" : "text-gray-700 hover:bg-gray-100",
    ].join(" ");

  return (
    <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
      <Link href={href("latest")} className={tabClass(sort === "latest")}>
        {t("feed.latest")}
      </Link>

      <Link href={href("top")} className={tabClass(sort === "top")}>
        {t("feed.topTea")} ☕
      </Link>
    </div>
  );
}