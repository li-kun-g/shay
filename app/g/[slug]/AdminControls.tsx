"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveJoinRequest, rejectJoinRequest } from "@/app/actions/groups";

export type PendingJoinRequest = {
  id: string;
  message: string | null;
  createdAt: string; // pass as string from server
  user: {
    username: string;
    name: string | null;
  };
};

export default function AdminControls(props: {
  groupId: string;
  requests: PendingJoinRequest[];
}) {
  const { requests } = props;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-600">
        No pending join requests.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3 shadow-sm">
      <div className="font-semibold">Admin controls</div>
      <div className="text-sm text-gray-600">
        Pending join requests ({requests.length})
      </div>

      <div className="space-y-2">
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border p-3">
            <div className="text-sm font-semibold">@{r.user.username}</div>
            <div className="text-xs text-gray-500">
              {r.user.name ?? "Student"} • {new Date(r.createdAt).toLocaleString()}
            </div>

            {r.message && (
              <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                “{r.message}”
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await approveJoinRequest(r.id);
                    router.refresh();
                  })
                }
                className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50"
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
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
