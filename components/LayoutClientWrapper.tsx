"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SideNav from "@/components/SideNav";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";


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
  const [closing, setClosing] = useState(false);

  function openMenu() {
    setClosing(false);
    setOpen(true);
  }

  function closeMenu() {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  }
  

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
            onClick={openMenu}
            aria-label="Open menu"
          >
            <BurgerIcon open={open} />
          </button>
          <Link href="/" className="redesign-logo">
            <span>Shay</span>
            <Image
              src="/lightlogo.png"
              alt="Shay logo light"
              className="block dark:hidden"
              width={50}
              height={50}
            />
            <Image
              src="/shaylogo.png"
              alt="Shay logo dark"
              className="hidden dark:block"
              width={50}
              height={50}
            />
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
        <div className={`redesign-drawer-overlay ${closing ? "closing" : "opening"}`}>
          <button
            type="button"
            className="redesign-drawer-backdrop"
            onClick={closeMenu}
            aria-label="Close menu"
          />
          <div className="redesign-drawer">
            <div className="redesign-drawer-head">
              <span className="redesign-logo">
                <span>Shay</span>
                <Image
                  src="/lightlogo.png"
                  alt="Shay logo light"
                  className="block dark:hidden"
                  width={40}
                  height={40}
                />
                <Image
                  src="/shaylogo.png"
                  alt="Shay logo dark"
                  className="hidden dark:block"
                  width={40}
                  height={40}
                />
              </span>
              <button
                type="button"
                className="redesign-btn-ghost"
                onClick={closeMenu}
              >
                Close
              </button>
            </div>
            <SideNav compact onNavigate={closeMenu} />
          </div>
        </div>
      )}
    </div>
  );
}
