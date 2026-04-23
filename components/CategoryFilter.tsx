"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type PostTag = { id: string; name: string; slug: string; emoji: string; order: number };

export default function CategoryFilter({ tags }: { tags: PostTag[] }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const current = (sp.get("cat") ?? "ALL").toUpperCase();

  function hrefFor(slug: string) {
    const params = new URLSearchParams(sp.toString());
    if (slug === "ALL") params.delete("cat");
    else params.set("cat", slug);
    params.delete("cursor");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const pill = (active: boolean) =>
    [
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition whitespace-nowrap",
      active
        ? "bg-black text-white border-black shadow-sm"
        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:border-[var(--border-strong)] dark:text-gray-200 dark:hover:bg-white/10",
    ].join(" ");

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="flex w-max min-w-full gap-2">
        <Link href={hrefFor("ALL")} className={pill(current === "ALL")}>
          All
        </Link>
        {tags.map((tag) => (
          <Link key={tag.slug} href={hrefFor(tag.slug)} className={pill(current === tag.slug)}>
            {tag.emoji && <span>{tag.emoji}</span>}
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
