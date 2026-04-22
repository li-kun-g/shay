"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/LanguageProvider";

export type NavItem = {
  href: string;
  key:
    | "nav.feed"
    | "nav.events"
    | "nav.myCampus"
    | "nav.groups"
    | "nav.messages"
    | "nav.notifications"
    | "nav.friends"
    | "nav.settings";
  icon: string;
};

const NAV: NavItem[] = [
  { href: "/", key: "nav.feed", icon: "/nav-icons/lenta.svg" },
  { href: "/events", key: "nav.events", icon: "/nav-icons/iventy.svg" },
  { href: "/campus", key: "nav.myCampus", icon: "/nav-icons/campus.svg" },
  { href: "/groups", key: "nav.groups", icon: "/nav-icons/gruppy.svg" },
  { href: "/messages", key: "nav.messages", icon: "/nav-icons/soobshcheniya.svg" },
  { href: "/notifications", key: "nav.notifications", icon: "/nav-icons/uvedomleniya.svg" },
  { href: "/friends", key: "nav.friends", icon: "/nav-icons/druzya.svg" },
  { href: "/settings", key: "nav.settings", icon: "/nav-icons/nastroyki.svg" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href);
}

export default function SideNav({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { t } = useI18n();

  async function loadUnreadCount() {
    try {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      if (!res.ok) return;

      const data = await res.json();
      setUnreadNotifications(typeof data?.count === "number" ? data.count : 0);
    } catch {
      // keep silent
    }
  }

  useEffect(() => {
    void loadUnreadCount();

    const tmr = setInterval(() => {
      void loadUnreadCount();
    }, 10000);

    return () => clearInterval(tmr);
  }, []);

  return (
    <aside className={compact ? "p-2" : "p-3"}>
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className={compact ? "px-3 pt-3 pb-2" : "px-4 pt-4 pb-2"}>
          {/* keeping "Menu" as-is for now (we can translate it later if you want) */}
          <div className="text-xs font-medium text-gray-500">Menu</div>
        </div>

        <nav className={compact ? "px-2 pb-3" : "px-2 pb-4"}>
          <div className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const isNotifications = item.href === "/notifications";
              const showBadge = isNotifications && unreadNotifications > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={[
                    "group flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition",
                    active ? "bg-black text-white" : "text-gray-800 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-xl border text-base transition shrink-0",
                        active
                          ? "bg-white/10 border-white/20"
                          : "bg-white border-gray-200 group-hover:bg-gray-100",
                      ].join(" ")}
                    >
                      <Image
                        src={item.icon}
                        alt=""
                        aria-hidden="true"
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain"
                      />
                    </span>

                    <span className={active ? "font-semibold truncate" : "font-medium truncate"}>
                      {t(item.key)}
                    </span>
                  </span>

                  {showBadge && (
                    <span
                      className={[
                        "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold shrink-0",
                        active ? "bg-white text-black" : "bg-black text-white",
                      ].join(" ")}
                      title={`${unreadNotifications} unread notifications`}
                    >
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
