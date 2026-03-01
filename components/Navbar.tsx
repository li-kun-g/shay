"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import SideNav from "@/components/SideNav";
import { useI18n } from "@/components/LanguageProvider";

function Hamburger({ open }: { open: boolean }) {
  return (
    <div className="relative h-5 w-5">
      <span
        className={`absolute left-0 top-0.5 h-0.5 w-5 bg-black dark:bg-white transition ${
          open ? "rotate-45 translate-y-2" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-2 h-0.5 w-5 bg-black dark:bg-white transition ${
          open ? "opacity-0" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-3.5 h-0.5 w-5 bg-black dark:bg-white transition ${
          open ? "-rotate-45 -translate-y-2" : ""
        }`}
      />
    </div>
  );
}

export default function Navbar() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const username = (session?.user as any)?.username as string | undefined;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b dark:bg-black/60 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-2 sm:px-4">
          <div className="h-14 flex items-center justify-between">
            {/* MOBILE LEFT */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                className="rounded-full border p-2 hover:bg-gray-50 dark:hover:bg-white/10 dark:text-white"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Hamburger open={open} />
              </button>

              {/* Hide logo in navbar while mobile drawer is open */}
              {!open && (
                <Link
                  href="/"
                  className="font-semibold text-lg flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-gray-50 dark:hover:bg-white/10 dark:text-white"
                >
                  <span>KIMEPish</span>
                  <span className="text-base">☕</span>
                </Link>
              )}
            </div>

            {/* DESKTOP LEFT */}
            <div className="hidden lg:flex items-center">
              <div className="w-[260px] flex justify-center">
                <Link
                  href="/"
                  className="font-semibold text-lg flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-gray-50 dark:hover:bg-white/10 dark:text-white"
                >
                  <span>KIMEPish</span>
                  <span className="text-base">☕</span>
                </Link>
              </div>

              <div className="w-6" />
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">
              {status === "loading" && (
                <span className="text-sm text-gray-500 dark:text-white/70">…</span>
              )}

              {status !== "authenticated" && (
                <>
                  <Link
                    href="/signin"
                    className="rounded-full border px-4 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/10 dark:text-white"
                  >
                    {t("auth.login")}
                  </Link>

                  <Link
                    href="/signup"
                    className="rounded-full bg-black px-4 py-1.5 text-sm text-white hover:opacity-90"
                  >
                    {t("auth.signup")}
                  </Link>
                </>
              )}

              {status === "authenticated" && session.user && (
                <>
                  {username && (
                    <Link
                      href={`/u/${username}`}
                      className="flex items-center gap-2 rounded-full border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-white/10 dark:text-white"
                    >
                      <span className="text-sm font-medium truncate max-w-[140px]">
                        {session.user.name ?? t("profile.student")}
                      </span>
                    </Link>
                  )}

                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/10 dark:text-white"
                  >
                    {t("auth.logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="fixed inset-0 z-[140] lg:hidden">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label={t("common.close")}
          />

          <div className="absolute left-0 top-0 h-full w-4/5 max-w-xs bg-white border-r shadow-xl dark:bg-black dark:border-white/10">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/10">
              <span className="font-semibold dark:text-white">KIMEPish ☕</span>
              <button
                className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/10 dark:text-white"
                onClick={() => setOpen(false)}
              >
                {t("common.close")}
              </button>
            </div>

            <SideNav onNavigate={() => setOpen(false)} compact />
          </div>
        </div>
      )}
    </>
  );
}