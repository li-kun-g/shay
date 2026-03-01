export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

type GroupRequestRow = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  requestedBy: {
    username: string;
    name: string | null;
  };
};

export default async function AdminGroupsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("id" in session.user)) {
    redirect("/signin");
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { isOfficial: true },
  });

  if (!me?.isOfficial) {
    redirect("/");
  }

  const requests: GroupRequestRow[] = await prisma.groupCreateRequest.findMany({
    where: { status: "PENDING" as any },
    orderBy: { createdAt: "asc" },
    include: {
      requestedBy: {
        select: { username: true, name: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Group Requests</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">No pending requests 🎉</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r: GroupRequestRow) => (
            <div
              key={r.id}
              className="rounded-2xl border bg-white p-4 space-y-2"
            >
              <div className="font-semibold">{r.name}</div>

              <div className="text-sm text-gray-600">
                @{r.requestedBy.username}
              </div>

              {r.description && <p className="text-sm">{r.description}</p>}

              <div className="flex gap-2 pt-2">
                <form action="/admin/groups/approve" method="POST">
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-xl bg-black px-4 py-2 text-sm text-white">
                    Approve
                  </button>
                </form>

                <form action="/admin/groups/reject" method="POST">
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-xl border px-4 py-2 text-sm">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}