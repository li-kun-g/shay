"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import SideNav from "@/components/SideNav";

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Проверяем, является ли текущая страница юридической или страницей аутентификации
  const isPageWithoutMenu = pathname === "/terms" || pathname === "/privacy" || pathname === "/signup" || pathname === "/signin" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/verify-email";

  // Если это страница без меню, рендерим ТОЛЬКО контент (children)
  if (isPageWithoutMenu) {
    return <>{children}</>;
  }

  // Для всех остальных страниц рендерим стандартный Shay UI
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="hidden lg:flex justify-center gap-6">
          <aside className="w-[260px] shrink-0 sticky top-[64px] h-[calc(100vh-64px)]">
            <SideNav />
          </aside>
          <main className="min-w-0 w-full max-w-[720px]">{children}</main>
        </div>

        <div className="lg:hidden">
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}