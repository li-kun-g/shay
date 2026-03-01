export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SubmitButton from "./submit-button";
import { cookies } from "next/headers";
import { getDict, type Lang } from "@/lib/i18n";

const LANG_COOKIE = "kimepish-lang";

async function requestGroupCreateAction(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const requestedById = session.user.id as string;

  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();

  if (!name) throw new Error("Group name is required.");
  if (!slugRaw) throw new Error("Slug is required.");

  const slug = slugRaw
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) throw new Error("Slug is invalid.");

  const existingGroup = await prisma.group.findUnique({ where: { slug } });
  if (existingGroup) throw new Error("A group with this slug already exists.");

  const existingReq = await prisma.groupCreateRequest.findUnique({
    where: { slug },
  });
  if (existingReq) throw new Error("A request with this slug already exists.");

  await prisma.groupCreateRequest.create({
    data: {
      name,
      slug,
      description: description || null,
      image: image || null,
      requestedById,
      status: "PENDING",
    },
  });

  redirect("/groups?requested=1");
}

export default async function GroupRequestPage() {
  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  const lang: Lang =
    cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";

  const dict = getDict(lang);

  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{dict["groups.requestTitle"]}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {dict["groups.requestDesc"]}
        </p>
      </div>

      <form action={requestGroupCreateAction} className="rounded-2xl border bg-white p-4 space-y-3">
        <input
          name="name"
          placeholder={dict["groups.form.name"]}
          className="w-full rounded-xl border px-3 py-2 text-sm"
          required
        />

        <input
          name="slug"
          placeholder={dict["groups.form.slug"]}
          className="w-full rounded-xl border px-3 py-2 text-sm"
          required
        />

        <textarea
          name="description"
          placeholder={dict["groups.form.description"]}
          className="w-full rounded-xl border px-3 py-2 text-sm min-h-[100px]"
        />

        <input
          name="image"
          placeholder={dict["groups.form.image"]}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />

        <SubmitButton />

        <p className="text-xs text-gray-500">
          {dict["groups.tip.before"]} <b>{dict["groups.tip.example"]}</b>
        </p>
      </form>
    </main>
  );
}