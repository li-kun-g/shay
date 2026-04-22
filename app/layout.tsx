export const runtime = "nodejs";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";
import TermsModal from "@/components/TermsModal";
import "./globals.css";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/i18n";

// Импортируем клиентский компонент для обертки контента
import LayoutClientWrapper from "@/components/LayoutClientWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shay ☕",
  description: "The limited edition's social network",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo_black_transparent.png", type: "image/png" },
    ],
    apple: "/logo_black_transparent.png",
    shortcut: "/favicon.ico",
  },
};

const LANG_COOKIE = "kimepish-lang";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANG_COOKIE)?.value;

  let initialLang: Lang = "EN";

  if (cookieLang && ["EN", "RU", "KK"].includes(cookieLang)) {
    initialLang = cookieLang as Lang;
  }

  let showTermsModal = false;

  if (session?.user && "id" in session.user) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { 
        language: true,
        termsAcceptedAt: true
      },
    });
    
    if (me?.language && ["EN", "RU", "KK"].includes(me.language)) {
      initialLang = me.language as Lang;
    }
    
    if (me && !me.termsAcceptedAt) {
      showTermsModal = true;
    }
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
          {/* Модалка условий */}
          {showTermsModal && session?.user?.email && (
            <TermsModal userEmail={session.user.email} />
          )}

          {/* Используем клиентскую обертку, чтобы скрыть Navbar 
              и SideNav на страницах /terms и /privacy 
          */}
          <LayoutClientWrapper>
            {children}
          </LayoutClientWrapper>
        </Providers>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}