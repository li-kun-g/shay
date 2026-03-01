"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toggleGoing } from "@/app/actions/toggleGoing";
import { getEventAttendees } from "@/app/actions/getEventAttendees";
import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";

type Creator = {
  username: string;
  name: string | null;
  image: string | null;
  emoji: string | null;
};

type GroupMini = {
  slug: string;
  name: string;
  image: string | null;
};

type MiniUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  emoji: string | null;
};

export default function EventCard(props: {
  event: {
    id: string;
    title: string;
    description: string;
    location: string | null;

    startsAtLabel: string;

    createdBy: Creator;
    group?: GroupMini | null;

    goingCount: number;
    goingByMe: boolean;

    attendeesPreview?: MiniUser[];

    imageUrl?: string | null;
  };
}) {
  const { t } = useI18n();
  const { event } = props;
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [list, setList] = useState<MiniUser[]>([]);

  const isGroupEvent = !!event.group;

  const actorHref = isGroupEvent ? `/g/${event.group!.slug}` : `/u/${event.createdBy.username}`;
  const actorLabel = isGroupEvent ? `@${event.group!.slug}` : `@${event.createdBy.username}`;

  const actorImg = isGroupEvent ? event.group!.image : event.createdBy.image;
  const actorFallback = isGroupEvent ? "👥" : event.createdBy.emoji ?? "☕";

  const preview = useMemo(() => {
    const arr = event.attendeesPreview ?? [];
    return arr.slice(0, 3);
  }, [event.attendeesPreview]);

  async function openAttendees() {
    setOpen(true);
    setLoadingList(true);
    try {
      const res = await getEventAttendees(event.id);
      setList(res.attendees);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-md overflow-hidden">
        {event.imageUrl ? (
          <div className="relative w-full aspect-[16/9] bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt={t("events.imageAlt")}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-gray-500">{event.startsAtLabel}</div>

              <div className="font-semibold text-base break-words">{event.title}</div>

              {event.location && (
                <div className="text-sm text-gray-600">
                  📍 {event.location}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => void toggleGoing(event.id))}
              className={[
                "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition",
                "ring-1 ring-black/15 shadow-sm hover:shadow-md active:scale-[0.99]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                event.goingByMe
                  ? "bg-black text-white ring-black/0"
                  : "bg-white text-gray-900 hover:bg-gray-50",
              ].join(" ")}
            >
              {event.goingByMe ? `${t("events.going")} ✅` : t("events.going")}
            </button>
          </div>

          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>

          <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
            <button
              type="button"
              onClick={() => {
                if (event.goingCount > 0) openAttendees();
              }}
              className={[
                "inline-flex items-center gap-2",
                event.goingCount > 0 ? "hover:opacity-80" : "cursor-default",
              ].join(" ")}
              aria-label={t("events.viewAttendees")}
            >
              {event.goingCount > 0 && preview.length > 0 && (
                <span className="flex items-center -space-x-2">
                  {preview.map((u, idx) => (
                    <span
                      key={u.id}
                      className="h-6 w-6 rounded-full overflow-hidden ring-2 ring-white bg-gray-100 flex items-center justify-center"
                      style={{ zIndex: 10 - idx }}
                    >
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt={t("common.avatarAlt")}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs">{u.emoji ?? "☕"}</span>
                      )}
                    </span>
                  ))}
                </span>
              )}

              <span>
                {event.goingCount} {t("events.goingCount")}
              </span>
            </button>

            <Link href={actorHref} className="hover:underline">
              <span className="inline-flex items-center gap-2">
                <span className="h-6 w-6 rounded-full overflow-hidden ring-1 ring-black/10 bg-gray-100 flex items-center justify-center">
                  {actorImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={actorImg}
                      alt={t("common.avatarAlt")}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span>{actorFallback}</span>
                  )}
                </span>
                <span>{actorLabel}</span>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80]">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label={t("common.close")}
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">{t("events.going")}</div>
              <button
                className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {t("common.close")}
              </button>
            </div>

            <div className="p-4">
              {loadingList ? (
                <div className="text-sm text-gray-500">{t("common.loading")}</div>
              ) : list.length === 0 ? (
                <div className="text-sm text-gray-500">{t("events.noOneYet")}</div>
              ) : (
                <div className="space-y-2">
                  {list.map((u) => (
                    <Link
                      key={u.id}
                      href={`/u/${u.username}`}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2 hover:bg-gray-50"
                      onClick={() => setOpen(false)}
                    >
                      <span className="h-9 w-9 rounded-full overflow-hidden bg-gray-100 ring-1 ring-black/10 flex items-center justify-center">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.image}
                            alt={t("common.avatarAlt")}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span>{u.emoji ?? "☕"}</span>
                        )}
                      </span>

                      <span className="min-w-0">
                        <div className="text-sm font-medium break-words">@{u.username}</div>
                        {u.name && (
                          <div className="text-xs text-gray-500 break-words">{u.name}</div>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}