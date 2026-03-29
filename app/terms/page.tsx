"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/i18n";

const termsContent = {
  EN: {
    title: "Terms of Service",
    back: "Back",
    updated: "Last updated: March 30, 2026",
    sections: [
      { t: "1. Acceptance", c: "By using shay.kz, you agree to these terms. We provide a community platform for campus communication." },
      { t: "2. Student-Led Initiative", c: "This service is built by students, for students. It is an independent project aimed at improving campus life." },
      { t: "3. Eligibility & Access", c: "Access is currently focused on the students. Accounts require verification." },
      { t: "4. Updates to Terms", c: "We may update these rules as the platform evolves. Continued use constitutes acceptance." },
      { t: "5. User Conduct", c: "No harassment or illegal activities. We reserve the right to moderate content." }
    ]
  },
  RU: {
    title: "Условия использования",
    back: "Назад",
    updated: "Обновлено: 30 марта 2026",
    sections: [
      { t: "1. Согласие", c: "Используя shay.kz, вы принимаете данные условия. Мы предоставляем платформу для общения внутри кампуса." },
      { t: "2. Студенческая инициатива", c: "Сервис предоставляется студентами для студентов. Это независимый проект." },
      { t: "3. Доступ", c: "На данный момент доступ ориентирован на студентов. Мы можем расширять доступ в будущем." },
      { t: "4. Обновление правил", c: "Мы оставляем за собой право обновлять правила. Дальнейшее использование означает согласие." },
      { t: "5. Правила сообщества", c: "Запрещены оскорбления и незаконный контент. Мы модерируем платформу." }
    ]
  },
  KK: {
    title: "Пайдалану шарттары",
    back: "Артқа",
    updated: "Соңғы жаңарту: 30 наурыз 2026",
    sections: [
      { t: "1. Келісім", c: "shay.kz пайдалану арқылы сіз осы шарттармен келісесіз. Біз кампус ішіндегі байланыс платформасын ұсынамыз." },
      { t: "2. Студенттік бастама", c: "Бұл сервис студенттермен студенттер үшін жасалған тәуелсіз жоба." },
      { t: "3. Қолжетімділік", c: "Қазіргі уақытта қолданыс тек студенттерге арналған. Тіркелгілер растауды талап етеді." },
      { t: "4. Шарттарды жаңарту", c: "Біз ережелерді жаңарту құқығын сақтаймыз. Сервисті пайдалану келісімді білдіреді." },
      { t: "5. Тәртіп ережелері", c: "Қорлауға және заңсыз мазмұнға тыйым салынады. Біз мазмұнды модерациялаймыз." }
    ]
  }
};

export default function TermsPage() {
  const { lang, setLang } = useI18n();
  const router = useRouter();
  const currentLang = (lang?.toUpperCase() || "EN") as keyof typeof termsContent;
  const content = termsContent[currentLang];

  return (
    <main className="fixed inset-0 z-[110] overflow-y-auto bg-[#FAF7F2] dark:bg-black py-12 px-4 transition-colors">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <button 
            onClick={() => router.back()}
            className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 order-2 sm:order-1"
          >
            ← {content.back}
          </button>

          <div className="flex gap-1 bg-gray-200/50 dark:bg-white/5 p-1 rounded-xl order-1 sm:order-2">
            {(["EN", "RU", "KK"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l as Lang)}
                className={`px-4 py-1 rounded-lg text-[10px] font-black transition-all ${
                  currentLang === l 
                    ? "bg-white dark:bg-white/10 shadow-sm text-black dark:text-white" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-black tracking-tight dark:text-white mb-2">
            {content.title}
          </h1>
          <p className="text-sm text-gray-400 font-medium">{content.updated}</p>
        </div>

        <div className="space-y-6">
          {content.sections.map((section, idx) => (
            <section key={idx} className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm">
              <h2 className="text-lg font-bold dark:text-white mb-3">{section.t}</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{section.c}</p>
            </section>
          ))}
        </div>

        <footer className="mt-16 text-center pb-12">
          <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">
            shay.kz — limited edition
          </p>
        </footer>
      </div>
    </main>
  );
}