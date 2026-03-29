"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";

export default function SignInPage() {
  const { t, lang, setLang } = useI18n();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // 1. Автоматическое определение языка устройства
  useEffect(() => {
    const savedLang = localStorage.getItem("lang"); // Проверяем, выбирал ли юзер язык раньше
    if (!savedLang) {
      const browserLang = navigator.language.split("-")[0].toUpperCase(); // 'ru', 'kk', 'en'
      const supportedLangs = ["EN", "RU", "KK"];
      
      if (supportedLangs.includes(browserLang)) {
        setLang(browserLang as any);
      }
    }
  }, [setLang]);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#FAF7F2] dark:bg-[#0a0a0a] transition-colors">
      
      {/* Language Switcher */}
      <div className="flex gap-2 mb-8 bg-gray-200/50 dark:bg-white/5 p-1 rounded-2xl">
        {(["EN", "RU", "KK"] as const).map((l) => (
          <button
            key={l}
            onClick={() => {
              setLang(l);
              localStorage.setItem("lang", l); // Запоминаем выбор пользователя
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              lang === l 
                ? "bg-white dark:bg-white/10 shadow-sm text-black dark:text-white" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md rounded-[2.5rem] border bg-white dark:bg-[#111] p-10 shadow-2xl shadow-black/5 border-gray-200 dark:border-white/5 transition-all text-center">
        <h1 className="text-4xl font-bold mb-6 dark:text-white flex items-center justify-center gap-2">
          Shay <span className="text-3xl">☕️</span>
        </h1>
        
{/* Динамический текст описания */}
<div className="space-y-4 text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-8 px-2">
  <p>
    {t("auth.signIn.independentDesc")} <span className="text-black dark:text-white font-semibold">{t("auth.signIn.noPasswords")}</span>.
  </p>
  <p>
    {t("auth.signIn.studentMailPrefix")}
    <span className="text-black dark:text-white font-semibold">
      {t("auth.signIn.studentMailHighlight")}
    </span>
    {t("auth.signIn.studentMailSuffix")}
  </p>
</div>

{/* Кнопка Google */}
<button
  onClick={handleGoogleSignIn}
  disabled={isGoogleLoading}
  // Убрали Tailwind стили цвета фона и текста, добавили инлайновые стили
  className="flex items-center justify-center w-full py-4 font-bold rounded-2xl border hover:bg-gray-50 transition-all gap-3 active:scale-[0.98] disabled:opacity-50"
  style={{
    backgroundColor: '#ffffff', // Гарантированный белый фон
    color: '#000000',           // Гарантированный черный текст
    borderColor: '#e5e7eb',    // border-gray-200
  }}
>
  {isGoogleLoading ? (
    <span className="animate-spin text-lg">⏳</span>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )}
  {t("auth.signIn.googleButton")}
</button>

        {/* Сноска о согласии с кликабельными ссылками */}
        <div className="mt-8 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed px-4">
          <p>
            {t("auth.signIn.agreementPrefix")}{" "}
            <Link href="/terms" className="underline hover:text-black dark:hover:text-white transition-colors">
              {t("auth.signIn.termsLink")}
            </Link>{" "}
            {t("auth.signIn.and")}{" "}
            <Link href="/privacy" className="underline hover:text-black dark:hover:text-white transition-colors">
              {t("auth.signIn.privacyLink")}
            </Link>.
          </p>
          <p className="mt-2">
            {t("auth.signIn.privacyNotice")}
          </p>
        </div>
      </div>
    </main>
  );
}