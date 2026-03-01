"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleGroupFollow, requestJoinGroup } from "@/app/actions/groups";
import { useI18n } from "@/components/LanguageProvider";

type Props = {
  groupId: string;
  isMember: boolean;
  isFollowing: boolean;
  hasPendingRequest: boolean;
  className?: string;
};

export default function GroupActions({
  groupId,
  isMember,
  isFollowing,
  hasPendingRequest,
  className,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  return (
    <div className={["flex flex-col gap-2", className ?? ""].join(" ")}>
      {/* FOLLOW / UNFOLLOW */}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleGroupFollow(groupId);
            router.refresh();
          })
        }
        className={[
          "w-full rounded-xl border px-4 py-2 text-sm transition",
          "k-border-strong",
          isFollowing
            ? "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            : "bg-white text-gray-900 hover:bg-gray-50 dark:bg-transparent dark:text-white dark:hover:bg-white/10",
          isPending ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {isFollowing ? t("groups.following") : t("groups.follow")}
      </button>

      {/* JOIN REQUEST */}
      {!isMember && (
        <button
          type="button"
          disabled={isPending || hasPendingRequest}
          onClick={() =>
            startTransition(async () => {
              await requestJoinGroup(groupId);
              router.refresh();
            })
          }
          className={[
            "w-full rounded-xl px-4 py-2 text-sm transition border",
            "k-border-strong",
            hasPendingRequest
              ? "bg-gray-200 text-gray-700 cursor-not-allowed dark:bg-white/12 dark:text-white/80"
              : "bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-white/90",
            isPending ? "opacity-50" : "",
          ].join(" ")}
        >
          {hasPendingRequest ? t("groups.requestSent") : t("groups.requestToJoin")}
        </button>
      )}

      {/* MEMBER LABEL */}
      {isMember && (
        <div className="text-xs text-center text-gray-500 dark:text-white/65">
          {t("groups.youAreMember")}
        </div>
      )}
    </div>
  );
}