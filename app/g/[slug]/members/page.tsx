export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import GroupMembersInfiniteList from "@/components/GroupMembersInfiniteList";

export default async function GroupMembersPage(props: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const p = await Promise.resolve(props.params);
  const slug = (p?.slug ?? "").trim().toLowerCase();

  return (
    <main className="mx-auto max-w-md px-4 py-6 md:max-w-2xl space-y-4">
      <Link href={`/g/${slug}`} className="text-sm text-gray-500 hover:underline">
        ← Back to group
      </Link>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Members</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse the group members list.
        </p>
      </section>

      <GroupMembersInfiniteList slug={slug} />
    </main>
  );
}