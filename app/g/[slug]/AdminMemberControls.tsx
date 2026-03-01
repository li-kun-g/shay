"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  promoteMember,
  demoteMember,
  removeMember,
} from "@/app/actions/groups";

type Props = {
  groupId: string;
  memberId: string;
  currentRole: "PRESIDENT" | "ADMIN" | "MEMBER";
};

export default function AdminMemberControls({
  groupId,
  memberId,
  currentRole,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canPromote = currentRole === "MEMBER";
  const canDemote = currentRole === "ADMIN"; // never demote PRESIDENT here
  const canRemove = currentRole !== "PRESIDENT"; // don't allow removing president

  return (
    <div className="flex items-center gap-2">
      {canPromote && (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await promoteMember(groupId, memberId);
              router.refresh();
            })
          }
          className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          Promote
        </button>
      )}

      {canDemote && (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await demoteMember(groupId, memberId);
              router.refresh();
            })
          }
          className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          Demote
        </button>
      )}

      {canRemove && (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await removeMember(groupId, memberId);
              router.refresh();
            })
          }
          className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          Remove
        </button>
      )}
    </div>
  );
}
