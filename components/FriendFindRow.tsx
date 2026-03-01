"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getFriendRelation,
  sendFriendRequest,
  type FriendRelation,
} from "@/app/actions/friends";
import { useI18n } from "@/components/LanguageProvider";

export default function FriendFindRow({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const { t } = useI18n();

  const router = useRouter();
  const [relation, setRelation] = useState<FriendRelation>("none");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function refresh() {
    const r = await getFriendRelation(userId);
    if (!r.ok) return;
    setRelation(r.relation);
    setRequestId((r as any).requestId ?? null);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const btnBase =
    "inline-flex justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60";
  const btnPrimary =
    "inline-flex justify-center rounded-xl bg-black text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60";

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/u/${username}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push(`/u/${username}`);
      }}
      className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-sm hover:bg-gray-50 transition cursor-pointer"
    >
      <div className="font-medium">@{username}</div>

      <div className="flex items-center gap-2">
        {relation === "none" && (
          <button
            disabled={pending}
            className={btnBase}
            onClick={(e) => {
              stop(e);
              start(async () => {
                await sendFriendRequest(userId);
                await refresh();
                router.refresh();
              });
            }}
          >
            {t("friends.add")}
          </button>
        )}

        {relation === "outgoing_pending" && (
          <>
            <button disabled className={`${btnBase} cursor-default`} onClick={stop}>
              {t("friends.requestSent")}
            </button>
            <button
              disabled={pending}
              className={btnBase}
              onClick={(e) => {
                stop(e);
                start(async () => {
                  await cancelFriendRequest(userId);
                  await refresh();
                  router.refresh();
                });
              }}
            >
              {t("friends.cancel")}
            </button>
          </>
        )}

        {relation === "incoming_pending" && (
          <>
            <button
              disabled={pending || !requestId}
              className={btnPrimary}
              onClick={(e) => {
                stop(e);
                start(async () => {
                  if (!requestId) return;
                  await acceptFriendRequest(requestId);
                  await refresh();
                  router.refresh();
                });
              }}
            >
              {t("friends.accept")}
            </button>
            <button
              disabled={pending || !requestId}
              className={btnBase}
              onClick={(e) => {
                stop(e);
                start(async () => {
                  if (!requestId) return;
                  await declineFriendRequest(requestId);
                  await refresh();
                  router.refresh();
                });
              }}
            >
              {t("friends.decline")}
            </button>
          </>
        )}

        {relation === "friends" && (
          <button disabled className={`${btnBase} cursor-default`} onClick={stop}>
            {t("friends.friends")} ✓
          </button>
        )}

        {relation === "self" && (
          <button disabled className={`${btnBase} cursor-default`} onClick={stop}>
            {t("friends.you")}
          </button>
        )}
      </div>
    </div>
  );
}