"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useI18n } from "@/components/LanguageProvider";

const featureIcons = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.5" className="h-[18px] w-[18px]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.5" className="h-[18px] w-[18px]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.5" className="h-[18px] w-[18px]">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.5" className="h-[18px] w-[18px]">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <path d="M6 1v3" />
        <path d="M10 1v3" />
        <path d="M14 1v3" />
      </svg>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.5" className="h-[18px] w-[18px]">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.5" className="h-[18px] w-[18px]">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

const landingCopy = {
  EN: {
    navSignUp: "Sign up",
    badge: "Campus network for Kimepians only",
    titleTop: "Shay",
    titleAccent: "edition",
    subtitle:
      "Shay is the independent social network built exclusively for university students. Share ideas, find your people, stay in the loop.",

    whyTitle: "Why Shay",
    whyHeadingTop: "Built for students,",
    whyHeadingBottom: "not advertisers",
    ctaTitle: "Ready to join your campus?",
    ctaSubtitle: "Use your student email - takes 10 seconds.",
    googleButton: "Continue with Google",
    features: [
      {
        title: "Verified students only",
        description: "Sign in with your university email. No outsiders, no bots - real campus community only.",
      },
      {
        title: "Groups & departments",
        description: "Find your faculty, year, or club. Connect with people who share your classes and interests.",
      },
      {
        title: "Real conversations",
        description: "Share notes, ask for help, post about campus life. No algorithm pushing rage - just your feed.",
      },
      {
        title: "Event board",
        description: "Campus events, club meetings, study sessions - all in one place, posted by students for students.",
      },
      {
        title: "Marketplace",
        description: "Sell textbooks, find a roommate, offer tutoring. Built-in student-to-student classifieds.",
      },
      {
        title: "Zero ads, zero passwords",
        description: "We authenticate via Google. We never see your password. No tracking, no selling your data.",
      },
    ],
  },
  RU: {
    navSignUp: "Регистрация",
    badge: "Кампусная сеть только для Kimepians",
    titleTop: "Shay",
    titleAccent: "edition",
    subtitle:
      "Shay — независимая социальная сеть только для студентов. Делитесь идеями, находите своих людей и оставайтесь в курсе.",
    createAccount: "Создать аккаунт",
    whyTitle: "Почему Shay",
    whyHeadingTop: "Сделано для студентов,",
    whyHeadingBottom: "а не для рекламы",
    ctaTitle: "Готов присоединиться к кампусу?",
    ctaSubtitle: "Используй студенческую почту — это займет 10 секунд.",
    googleButton: "Продолжить через Google",
    features: [
      {
        title: "Только проверенные студенты",
        description: "Вход через университетскую почту. Никаких посторонних и ботов — только реальное комьюнити кампуса.",
      },
      {
        title: "Группы и факультеты",
        description: "Найди свой факультет, курс или клуб. Общайся с людьми с похожими интересами и предметами.",
      },
      {
        title: "Живое общение",
        description: "Делись заметками, проси помощь, обсуждай жизнь кампуса. Лента без токсичных алгоритмов.",
      },
      {
        title: "Доска событий",
        description: "Мероприятия, встречи клубов, учебные сессии — все в одном месте, от студентов для студентов.",
      },
      {
        title: "Маркетплейс",
        description: "Продавай учебники, ищи соседа, предлагай репетиторство. Встроенные объявления студент-студенту.",
      },
      {
        title: "Ноль рекламы, ноль паролей",
        description: "Мы авторизуем через Google и не видим твой пароль. Без трекинга и продажи данных.",
      },
    ],
  },
  KK: {
    navSignUp: "Тіркелу",
    badge: "Kimepians үшін кампус желісі",
    titleTop: "Shay",
    titleAccent: "edition",
    subtitle:
      "Shay — тек студенттерге арналған тәуелсіз әлеуметтік желі. Ой бөліс, өз ортаңды тап және кампус жаңалықтарынан қалыспа.",
    createAccount: "Аккаунт жасау",
    whyTitle: "Неге Shay",
    whyHeadingTop: "Студенттер үшін жасалған,",
    whyHeadingBottom: "жарнама үшін емес",
    ctaTitle: "Кампусыңа қосылуға дайынсың ба?",
    ctaSubtitle: "Студенттік email қолдан — небәрі 10 секунд.",
    googleButton: "Google арқылы жалғастыру",
    features: [
      {
        title: "Тек расталған студенттер",
        description: "Университет email арқылы кіресің. Бөгде адам да, бот та жоқ — тек шынайы кампус қауымдастығы.",
      },
      {
        title: "Топтар мен факультеттер",
        description: "Өз факультетіңді, курсыңды не клубыңды тап. Ұқсас қызығушылығы бар адамдармен байланыс орнат.",
      },
      {
        title: "Шынайы әңгіме",
        description: "Жазба бөліс, көмек сұра, кампус өмірін талқыла. Агрессияны итермелейтін алгоритмдерсіз лента.",
      },
      {
        title: "Іс-шаралар тақтасы",
        description: "Кампус іс-шаралары, клуб кездесулері, оқу сессиялары — бәрі бір жерде, студенттен студентке.",
      },
      {
        title: "Маркетплейс",
        description: "Оқулық сат, бөлмелес тап, репетиторлық ұсын. Студентке арналған хабарландырулар осында.",
      },
      {
        title: "Жарнама жоқ, пароль жоқ",
        description: "Google арқылы авторизация жасаймыз, пароліңді сақтамаймыз. Бақылау да, дерек сату да жоқ.",
      },
    ],
  },
} as const;

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { lang, setLang, isPending } = useI18n();
  const copy = landingCopy[lang];
  const features = featureIcons.map((feature, index) => ({
    icon: feature.icon,
    title: copy.features[index].title,
    description: copy.features[index].description,
  }));

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className="w-full bg-[#0a0a0a] text-[#f0f0f0]">
      <nav className="flex items-center justify-between border-b border-[#1e1e1e] px-5 py-5 sm:px-10">
        <Link href="/" className="text-[18px] font-medium tracking-[-0.3px] text-white">
          Shay ☕
        </Link>

        <Link
          href="/signup"
          className="rounded-lg bg-[#7F77DD] px-[18px] py-2 text-[13px] font-medium text-white transition hover:opacity-90"
        >
          {copy.navSignUp}
        </Link>
      </nav>

      <section className="mx-auto max-w-[720px] px-6 pb-20 pt-24 text-center sm:px-10 sm:pt-[100px]">
        <div className="mb-8 inline-flex items-center gap-[6px] rounded-full border border-[#3C3489] bg-[#1a1528] px-[14px] py-[5px] text-[12px] text-[#AFA9EC]">
          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#7F77DD]" />
          {copy.badge}
        </div>

        <h1 className="mb-5 text-[44px] font-semibold leading-[1.1] tracking-[-1.5px] text-white sm:text-[56px]">
          {copy.titleTop}
          <br />
          <span className="text-[#7F77DD]">{copy.titleAccent}</span>
        </h1>

        <p className="mx-auto mb-10 max-w-[480px] text-[16px] leading-[1.7] text-[#666] sm:text-[17px]">
          {copy.subtitle}
        </p>

        <div className="mb-4 flex justify-center">
          <div className="relative inline-flex gap-1 overflow-hidden rounded-2xl bg-[#111318] p-1">
            <div
              className={`pointer-events-none absolute bottom-1 top-1 w-[52px] rounded-xl bg-[#1c1f2a] transition-transform duration-300 ease-out ${
                lang === "EN" ? "translate-x-0" : lang === "RU" ? "translate-x-[56px]" : "translate-x-[112px]"
              }`}
            />
            {(["EN", "RU", "KK"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                disabled={isPending}
                className={`relative z-10 w-[52px] rounded-xl px-0 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  lang === l ? "text-white" : "text-[#777] hover:text-[#cfcfcf]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-[10px] rounded-[10px] bg-[#f8f8f8] px-8 py-[14px] text-[15px] font-medium text-[#1a1a1a] transition hover:bg-[#e8e8e8] disabled:opacity-60"
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {copy.googleButton}
          </button>
        </div>
      </section>
      <section id="features" className="mx-auto max-w-[900px] px-6 py-20 sm:px-10">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[1.5px] text-[#534AB7]">{copy.whyTitle}</p>
        <h2 className="mb-12 text-[32px] font-medium leading-[1.25] tracking-[-0.5px] text-white">
          {copy.whyHeadingTop}
          <br />
          {copy.whyHeadingBottom}
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-[14px] border border-[#1e1e1e] bg-[#111] p-6">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1528]">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-[14px] font-medium text-[#e8e8e8]">{feature.title}</h3>
              <p className="text-[13px] leading-[1.6] text-[#555]">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="about"
        className="mx-5 mb-10 rounded-[20px] border border-[#2a2560] bg-[#100f1e] px-6 py-14 text-center sm:mx-10 sm:px-10 sm:py-16"
      >
        <h2 className="mb-[14px] text-[34px] font-medium tracking-[-0.5px] text-white sm:text-[36px]">
          {copy.ctaTitle}
        </h2>
        <p className="mb-9 text-[15px] text-[#555]">{copy.ctaSubtitle}</p>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-[10px] rounded-[10px] bg-[#f8f8f8] px-8 py-[14px] text-[15px] font-medium text-[#1a1a1a] transition hover:bg-[#e8e8e8] disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {copy.googleButton}
        </button>
      </section>

    </main>
  );
}
