"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveJoinRequest,
  rejectJoinRequest,
} from "@/app/actions/groups";

type Request = {
  id: string;
  message: string | null;
  user: {
    username: string;
    name: string | null;
  };
};

export default function JoinRequestsPanel({
  requests,
}: {
  requests: Request[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-4 shadow-sm text-sm text-gray-500">
        No pending join requests.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <div className="font-semibold">Join requests</div>

      {requests.map((r) => (
        <div
          key={r.id}
          className="rounded-xl border p-3 flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="font-medium text-sm">@{r.user.username}</div>
            {r.user.name && (
              <div className="text-xs text-gray-500">{r.user.name}</div>
            )}
            {r.message && (
              <div className="text-xs text-gray-600 mt-1 italic">
                “{r.message}”
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await approveJoinRequest(r.id);
                  router.refresh();
                })
              }
              className="rounded-lg bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              Approve
            </button>

            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await rejectJoinRequest(r.id);
                  router.refresh();
                })
              }
              className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
