export const runtime = "nodejs";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import SideNav from "@/components/SideNav";
import "./globals.css";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KIMEPish ☕",
  description: "KIMEP student social network",
};

const LANG_COOKIE = "kimepish-lang";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // 1) cookie (fast) 2) DB 3) default EN
  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;

  let initialLang: Lang = (cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : null) as any;
  if (!initialLang) initialLang = "EN";

  if (session?.user && "id" in session.user) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { language: true },
    });
    if (me?.language) initialLang = me.language as Lang;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var key = "kimepish-theme";
    var t = localStorage.getItem(key) || "system";
    var isDark = t === "dark" || (t === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = isDark ? "dark" : "light";
  } catch (e) {}
})();`,
          }}
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} bg-[var(--background)] text-[var(--foreground)] antialiased`}>
        <Providers initialLang={initialLang}>
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
        </Providers>
      </body>
    </html>
  );
}