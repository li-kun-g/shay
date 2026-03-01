"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NotificationsMenuItem() {
  const pathname = usePathname();
  const isActive = pathname === "/notifications";
  const [count, setCount] = useState(0);

  async function loadCount() {
    try {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      const data = await res.json();
      setCount(typeof data?.count === "number" ? data.count : 0);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    void loadCount();

    // lightweight polling so badge updates while user uses app
    const t = setInterval(() => {
      void loadCount();
    }, 10000);

    return () => clearInterval(t);
  }, []);

  return (
    <Link
      href="/notifications"
      className={[
        "flex items-center justify-between rounded-2xl px-4 py-3 transition",
        isActive ? "bg-black text-white" : "hover:bg-gray-50",
      ].join(" ")}
    >
      <span className="flex items-center gap-3">
        <span
          className={[
            "inline-flex h-10 w-10 items-center justify-center rounded-full border text-xl",
            isActive ? "border-white/20 bg-black/20" : "bg-white",
          ].join(" ")}
        >
          🔔
        </span>
        <span className="text-sm sm:text-base font-medium">Notifications</span>
      </span>

      {count > 0 && (
        <span
          className={[
            "min-w-6 h-6 px-2 inline-flex items-center justify-center rounded-full text-xs font-semibold",
            isActive ? "bg-white text-black" : "bg-black text-white",
          ].join(" ")}
          title={`${count} unread`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}