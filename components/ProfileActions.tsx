"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getFriendRelation,
  removeFriend,
  sendFriendRequest,
  type FriendRelation,
} from "@/app/actions/friends";
import { useI18n } from "@/components/LanguageProvider";

export default function ProfileActions({
  profileUserId,
  profileUsername,
}: {
  profileUserId: string;
  profileUsername: string;
}) {
  const router = useRouter();
  const { t } = useI18n();

  const [relation, setRelation] = useState<FriendRelation>("none");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const res = await getFriendRelation(profileUserId);
    if (!res.ok) return;
    setRelation(res.relation);
    setRequestId((res as any).requestId ?? null);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId]);

  const btnBase =
    "inline-flex justify-center rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed";
  const btnPrimary = "bg-black text-white hover:opacity-90";
  const btnSecondary =
    "border hover:bg-gray-50 dark:hover:bg-white/10";

  function onMessage() {
    // ✅ Instagram-style: do NOT create DB chat yet
    router.push(`/messages/new?to=${encodeURIComponent(profileUsername)}`);
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {relation === "none" && (
          <button
            disabled={pending}
            className={`${btnBase} ${btnPrimary}`}
            onClick={() =>
              startTransition(async () => {
                await sendFriendRequest(profileUserId);
                await refresh();
              })
            }
          >
            {t("friends.addFriend")}
          </button>
        )}

        {relation === "incoming_pending" && (
          <>
            <button
              disabled={pending || !requestId}
              className={`${btnBase} ${btnPrimary}`}
              onClick={() =>
                startTransition(async () => {
                  if (!requestId) return;
                  await acceptFriendRequest(requestId);
                  await refresh();
                })
              }
            >
              {t("friends.accept")}
            </button>

            <button
              disabled={pending || !requestId}
              className={`${btnBase} ${btnSecondary}`}
              onClick={() =>
                startTransition(async () => {
                  if (!requestId) return;
                  await declineFriendRequest(requestId);
                  await refresh();
                })
              }
            >
              {t("friends.decline")}
            </button>
          </>
        )}

        {relation === "outgoing_pending" && (
          <>
            <button disabled className={`${btnBase} ${btnSecondary}`}>
              {t("friends.requestSent")}
            </button>

            <button
              disabled={pending}
              className={`${btnBase} ${btnSecondary}`}
              onClick={() =>
                startTransition(async () => {
                  await cancelFriendRequest(profileUserId);
                  await refresh();
                })
              }
            >
              {t("common.cancel")}
            </button>
          </>
        )}

        {relation === "friends" && (
          <button
            disabled={pending}
            className={`${btnBase} ${btnSecondary}`}
            onClick={() =>
              startTransition(async () => {
                await removeFriend(profileUserId);
                await refresh();
              })
            }
          >
            {t("friends.friends")} ✓
          </button>
        )}

        <button
          disabled={pending}
          className={`${btnBase} ${btnSecondary}`}
          onClick={onMessage}
        >
          {t("messages.message")}
        </button>
      </div>
    </div>
  );
}