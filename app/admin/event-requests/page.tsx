import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveEventRequest } from "@/app/actions/approveEventRequest";
import { rejectEventRequest } from "@/app/actions/rejectEventRequest";

function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const styles =
    status === "PENDING"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : status === "APPROVED"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}

type SearchParams = Promise<{
  status?: "PENDING" | "APPROVED" | "REJECTED";
}>;

export default async function AdminEventRequestsPage(props: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  const userId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isOfficial: true, username: true },
  });

  if (!me?.isOfficial) {
    throw new Error("Forbidden");
  }

  const { status } = await props.searchParams;
  const currentStatus = status ?? "PENDING";

  const requests = await prisma.eventRequest.findMany({
    where: { status: currentStatus },
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          isOfficial: true,
          isGroupAccount: true,
        },
      },
    },
  });

  const tabBase =
    "rounded-xl border px-3 py-2 text-sm font-medium transition";
  const activeTab = "bg-black text-white border-black";
  const inactiveTab = "bg-white text-gray-700 hover:bg-gray-50";

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Event Requests Moderation</h1>
        <div className="text-sm text-gray-500">Signed in as @{me.username}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/event-requests?status=PENDING"
          className={`${tabBase} ${currentStatus === "PENDING" ? activeTab : inactiveTab}`}
        >
          Pending
        </a>
        <a
          href="/admin/event-requests?status=APPROVED"
          className={`${tabBase} ${currentStatus === "APPROVED" ? activeTab : inactiveTab}`}
        >
          Approved
        </a>
        <a
          href="/admin/event-requests?status=REJECTED"
          className={`${tabBase} ${currentStatus === "REJECTED" ? activeTab : inactiveTab}`}
        >
          Rejected
        </a>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">
          No {currentStatus.toLowerCase()} requests.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{r.title}</div>
                  <div className="text-sm text-gray-500">
                    by {r.requestedBy.name || r.requestedBy.username} ({r.requestedBy.email})
                    {r.requestedBy.isOfficial ? " • Official" : ""}
                    {r.requestedBy.isGroupAccount ? " • Group account" : ""}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    Requested: {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <p className="text-sm whitespace-pre-wrap">{r.description}</p>

              <div className="text-sm text-gray-600 space-y-1">
                {r.location ? <div>📍 {r.location}</div> : null}
                <div>🕒 Starts: {new Date(r.startsAt).toLocaleString()}</div>
                {r.endsAt ? <div>🕒 Ends: {new Date(r.endsAt).toLocaleString()}</div> : null}
              </div>

              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  className="h-56 w-full rounded-xl object-cover border"
                />
              ) : null}

              {r.status === "PENDING" ? (
                <div className="flex gap-2 pt-2">
                  <form action={approveEventRequest.bind(null, r.id)}>
                    <button
                      type="submit"
                      className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </form>

                  <form action={rejectEventRequest.bind(null, r.id)}>
                    <button
                      type="submit"
                      className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}