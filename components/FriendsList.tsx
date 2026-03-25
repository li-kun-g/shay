"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { removeFriend } from "@/app/actions/friends";
import { useI18n } from "@/components/LanguageProvider";

type CampusFilter = "all" | "on" | "off";

type FriendLite = {
  id: string;
  username: string;
  campusStatus: string | null;
  campusStatusExpiresAt: string | Date | null;
};

/**
 * Определяет текущее состояние статуса: "ON", "OFF" или null (скрыть)
 */
function getActiveCampusStatus(friend: FriendLite): "ON" | "OFF" | null {
  if (!friend.campusStatus) return null;

  // Проверяем срок действия
  if (friend.campusStatusExpiresAt) {
    const exp = new Date(friend.campusStatusExpiresAt);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() <= Date.now()) {
      return null; // Время вышло — скрываем статус
    }
  }

  // Если статус "OFF" (строка), возвращаем его как есть
  if (friend.campusStatus === "OFF") return "OFF";
  
  // Если статус "ON", возвращаем его
  if (friend.campusStatus === "ON") return "ON";

  // На случай, если в базе другие значения
  return null;
}

export default function FriendsList({ friends }: { friends: FriendLite[] }) {
  const { t } = useI18n();

  const router = useRouter();
  const [q, setQ] = useState("");
  const [campusFilter, setCampusFilter] = useState<CampusFilter>("all");
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const needle = s.startsWith("@") ? s.slice(1) : s;

    return friends.filter((f) => {
      const matchesSearch = !needle || f.username.toLowerCase().includes(needle);
      
      const currentStatus = getActiveCampusStatus(f);

      const matchesCampus =
        campusFilter === "all"
          ? true
          : campusFilter === "on"
            ? currentStatus === "ON"
            : currentStatus === "OFF";

      return matchesSearch && matchesCampus;
    });
  }, [q, friends, campusFilter]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-white p-3 shadow-sm space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("friends.searchFriendsPlaceholder")}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCampusFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              campusFilter === "all"
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {t("friends.all")}
          </button>

          <button
            type="button"
            onClick={() => setCampusFilter("on")}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              campusFilter === "on"
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {t("friends.onCampus")}
          </button>

          <button
            type="button"
            onClick={() => setCampusFilter("off")}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              campusFilter === "off"
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {t("friends.offCampus")}
          </button>

          <span className="ml-auto text-xs text-gray-500">
            {filtered.length} {t("friends.shown")}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400">{t("friends.noMatches")}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const currentStatus = getActiveCampusStatus(f);

            return (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <Link href={`/u/${f.username}`} className="font-medium hover:underline">
                    @{f.username}
                  </Link>

                  {/* Рендерим плашку только если статус активен (ON или OFF) */}
                  {currentStatus && (
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                          currentStatus === "ON"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {currentStatus === "ON" ? t("friends.onCampus") : t("friends.offCampus")}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  disabled={pending}
                  className="text-sm text-red-600 hover:underline disabled:opacity-60"
                  onClick={() =>
                    start(async () => {
                      await removeFriend(f.id);
                      router.refresh();
                    })
                  }
                >
                  {t("friends.remove")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}