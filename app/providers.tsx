"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/i18n";

export default function Providers({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang: Lang;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}