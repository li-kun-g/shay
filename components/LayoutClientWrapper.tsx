"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SideNav from "@/components/SideNav";
import { signOut, useSession } from "next-auth/react";

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <div className="redesign-burger-icon" aria-hidden="true">
      <span className={open ? "top open" : "top"} />
      <span className={open ? "mid open" : "mid"} />
      <span className={open ? "bot open" : "bot"} />
    </div>
  );
}

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Проверяем, является ли текущая страница юридической или страницей аутентификации
  const isPageWithoutMenu =
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/signup" ||
    pathname === "/signin" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  // Если это страница без меню, рендерим ТОЛЬКО контент (children)
  if (isPageWithoutMenu) {
    return <>{children}</>;
  }

  const displayName = session?.user?.name || session?.user?.email || "User";

  // Новый shell для всех внутренних разделов + burger menu на мобильных
  return (
    <div className="redesign-page">
      <header className="redesign-topbar">
        <div className="redesign-topbar-left">
          <button
            type="button"
            className="redesign-burger-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <BurgerIcon open={open} />
          </button>
          <Link href="/" className="redesign-logo">
            Shay <span>☕</span>
          </Link>
        </div>

        <div className="redesign-header-right">
          <button className="redesign-btn-ghost">{displayName}</button>
          <button
            type="button"
            className="redesign-btn-logout"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="redesign-layout">
        <aside className="redesign-sidebar desktop">
          <SideNav />
        </aside>
        <main className="redesign-main-content">{children}</main>
      </div>

      {open && (
        <div className="redesign-drawer-overlay">
          <button
            type="button"
            className="redesign-drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="redesign-drawer">
            <div className="redesign-drawer-head">
              <span className="redesign-logo">Shay <span>☕</span></span>
              <button
                type="button"
                className="redesign-btn-ghost"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <SideNav compact onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
