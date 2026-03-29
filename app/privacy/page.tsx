"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/i18n";

const privacyContent = {
  EN: {
    title: "Privacy Policy",
    back: "Back",
    sections: [
      { t: "Data Collection", c: "We collect your email, name, and profile info via Google OAuth or sign-up to verify your student status." },
      { t: "Data Usage", c: "Your data is used to personalize your campus experience and manage your 'Campus Status' visibility." },
      { t: "Data Protection", c: "We do not sell your data. We use industry-standard encryption to keep your tea safe." }
    ]
  },
  RU: {
    title: "Политика конфиденциальности",
    back: "Назад",
    sections: [
      { t: "Сбор данных", c: "Мы собираем email, имя и данные профиля через Google или регистрацию для подтверждения статуса студента." },
      { t: "Использование", c: "Данные используются для персонализации и управления вашим статусом в кампусе." },
      { t: "Защита", c: "Мы не продаем ваши данные. Мы используем шифрование для защиты вашей личной информации." }
    ]
  },
  KK: {
    title: "Құпиялылық саясаты",
    back: "Артқа",
    sections: [
      { t: "Мәліметтерді жинау", c: "Студент мәртебесін растау үшін біз сіздің поштаңызды, атыңызды және профиль деректеріңізді жинаймыз." },
      { t: "Қолдану", c: "Деректер кампустағы мәртебеңізді басқару және платформаны жекелендіру үшін қолданылады." },
      { t: "Қорғау", c: "Біз сіздің деректеріңізді сатпаймыз. Ақпаратты қорғау үшін заманауи шифрлау әдістерін қолданамыз." }
    ]
  }
};

export default function PrivacyPage() {
  const { lang, setLang } = useI18n();
  const router = useRouter();
  
  const currentLang = (lang?.toUpperCase() || "EN") as keyof typeof privacyContent;
  const content = privacyContent[currentLang];

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
        </div>

        <div className="space-y-6">
          {content.sections.map((section, idx) => (
            <section key={idx} className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm">
              <h2 className="text-lg font-bold dark:text-white mb-3">
                {section.t}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {section.c}
              </p>
            </section>
          ))}
        </div>

        <footer className="mt-16 text-center pb-12">
          <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">
            shay.kz — secure & student-first
          </p>
        </footer>
      </div>
    </main>
  );
}