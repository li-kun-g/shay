"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type TabKey = "posts" | "friends" | "groups";

export default function ProfileTabs(props: {
  postsCount?: number;
  friendsCount?: number;
  groupsCount?: number;
}) {
  const { postsCount, friendsCount, groupsCount } = props;

  const pathname = usePathname();
  const sp = useSearchParams();

  const raw = (sp.get("tab") ?? "posts").toLowerCase();
  const current: TabKey =
    raw === "friends" || raw === "groups" || raw === "posts"
      ? (raw as TabKey)
      : "posts";

  function hrefFor(tab: TabKey) {
    const params = new URLSearchParams(sp.toString());
    if (tab === "posts") params.delete("tab");
    else params.set("tab", tab);

    // reset any list cursor if you ever keep it in URL
    params.delete("cursor");

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const tabClass = (tab: TabKey) =>
    [
      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
      current === tab
        ? "bg-black text-white shadow-sm"
        : "text-gray-700 hover:bg-gray-100",
    ].join(" ");

  const countClass = (tab: TabKey) =>
    [
      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
      current === tab ? "bg-white/15 text-white" : "bg-gray-200 text-gray-700",
    ].join(" ");

  return (
    <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
      <Link href={hrefFor("posts")} className={tabClass("posts")}>
        <span>Posts</span>
        {typeof postsCount === "number" && (
          <span className={countClass("posts")}>{postsCount}</span>
        )}
      </Link>

      <Link href={hrefFor("friends")} className={tabClass("friends")}>
        <span>Friends</span>
        {typeof friendsCount === "number" && (
          <span className={countClass("friends")}>{friendsCount}</span>
        )}
      </Link>

      <Link href={hrefFor("groups")} className={tabClass("groups")}>
        <span>Groups</span>
        {typeof groupsCount === "number" && (
          <span className={countClass("groups")}>{groupsCount}</span>
        )}
      </Link>
    </div>
  );
}