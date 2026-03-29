"use client";

import React, { createContext, useContext, useMemo, useState, useTransition, useEffect } from "react";
import type { Lang, I18nKey } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";
import { setLanguage } from "@/app/actions/setLanguage";

type Ctx = {
  lang: Lang;
  t: (key: I18nKey) => string;
  setLang: (lang: Lang) => void;
  isPending: boolean;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider(props: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(props.initialLang);
  const [isPending, startTransition] = useTransition();

  const dict = useMemo(() => getDict(lang), [lang]);
  const t = (key: I18nKey) => dict[key] ?? key;

  const setLang = (next: Lang) => {
    setLangState(next); // instant UI change
    startTransition(async () => {
      await setLanguage(next); // persist DB + cookie
    });
  };

  // 🌍 Авто-определение языка девайса при первом визите
  useEffect(() => {
    const hasLangCookie = document.cookie.includes("kimepish-lang");

    if (!hasLangCookie) {
      const browserLang = navigator.language.split("-")[0].toUpperCase();
      
      let targetLang: Lang = "EN"; 
      if (browserLang === "RU") targetLang = "RU";
      if (browserLang === "KK") targetLang = "KK";

      if (targetLang !== props.initialLang) {
        // Если язык девайса отличается от EN — вызываем сохранение
        setLang(targetLang);
      } else {
        // Если девайс и так на EN, просто ставим куку вручную,
        // чтобы этот useEffect больше не срабатывал
        document.cookie = `kimepish-lang=${targetLang}; path=/; max-age=31536000`;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialLang]);

  const value = useMemo(() => ({ lang, t, setLang, isPending }), [lang, isPending]);

  return <LanguageContext.Provider value={value}>{props.children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider />");
  return ctx;
}