"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider"; // Подключаем глобальный контекст

const translations = {
  EN: {
    welcome: "Welcome to Shay! ☕",
    text: "Before we start, please confirm that you agree to our Terms of Service and Privacy Policy. This service is built by students for students.",
    button: "I Agree",
    terms: "Terms",
    privacy: "Privacy",
  },
  RU: {
    welcome: "Добро пожаловать в Shay! ☕",
    text: "Прежде чем начать, пожалуйста, подтвердите согласие с Условиями использования и Политикой конфиденциальности. Сервис создан студентами для студентов.",
    button: "Я согласен",
    terms: "Условия",
    privacy: "Конфиденциальность",
  },
  KK: {
    welcome: "Shay-ге қош келдіңіз! ☕",
    text: "Бастамас бұрын, Пайдалану шарттарымен және Құпиялылық саясатымен келісетініңізді растаңыз. Сервис студенттермен студенттер үшін жасалған.",
    button: "Келісемін",
    terms: "Шарттар",
    privacy: "Құпиялылық",
  }
};

export default function TermsModal({ userEmail }: { userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname(); // Получаем текущий путь
  const { lang, setLang } = useI18n(); // Достаем глобальный язык

  useEffect(() => {
    // Проверяем, нужно ли показывать окно (логика проверки встроена в родительский layout)
    setIsOpen(true);
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Запрос к API для обновления termsAcceptedAt в Prisma
      const res = await fetch("/api/user/accept-terms", {
        method: "POST",
        body: JSON.stringify({ email: userEmail }),
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh(); // Обновляем страницу, чтобы убрать модалку
      }
    } catch (err) {
      console.error("Failed to accept terms", err);
    } finally {
      setLoading(false);
    }
  };

  // 🛑 Главная фишка: если мы на странице документов, модалка НЕ рендерится
  if (!isOpen || pathname === "/terms" || pathname === "/privacy") {
    return null;
  }

  // Приводим глобальный lang к нужному формату (на всякий случай)
  const currentLang = (lang?.toUpperCase() || "EN") as keyof typeof translations;
  const t = translations[currentLang];

  return (
    // ✨ ИСПРАВЛЕНИЕ z-index: Устанавливаем z-[1000], чтобы гарантированно перекрыть 
    // элементы UI, такие как кнопка FAB (обычно z-50), Navbar и Sidebar.
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#111] rounded-[2.5rem] p-8 shadow-2xl border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in duration-300">
        
        {/* Глобальный переключатель языков */}
        <div className="flex justify-center gap-2 mb-6 bg-gray-100 dark:bg-white/5 p-1 rounded-2xl w-fit mx-auto">
          {(["EN", "RU", "KK"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                currentLang === l 
                  ? "bg-white dark:bg-white/10 shadow-sm text-black dark:text-white" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-center dark:text-white mb-4">
          {t.welcome}
        </h2>
        
        <p className="text-sm text-center text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
          {t.text}
        </p>

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full rounded-2xl bg-black dark:bg-white dark:text-black py-4 text-sm font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "..." : t.button}
        </button>

        {/* Ссылки открываются в этой же вкладке */}
        <div className="mt-6 flex justify-center gap-4 text-[11px] text-gray-400 font-medium">
          <Link href="/terms" className="underline hover:text-black dark:hover:text-white transition-colors">
            {t.terms}
          </Link>
          <Link href="/privacy" className="underline hover:text-black dark:hover:text-white transition-colors">
            {t.privacy}
          </Link>
        </div>
      </div>
    </div>
  );
}