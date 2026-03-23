import { getPendingComments, updateCommentStatus } from "../../actions/adminComments";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// Описываем тип для комментария, чтобы убрать ошибку "any"
interface PendingComment {
  id: string;
  content: string;
  authorId: string;
  author: {
    name: string | null;
    username: string;
  };
  post: {
    content: string;
  };
}

export default async function AdminCommentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isOfficial: true }
  });

  if (!user?.isOfficial) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-xl font-semibold text-red-600">
          403 — Доступ запрещен. Только для администрации Shay.
        </h1>
      </div>
    );
  }

  // Принудительно приводим к типу, чтобы TS видел структуру
  const pending = (await getPendingComments()) as any as PendingComment[];

  async function approveAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await updateCommentStatus(id, "APPROVED");
    revalidatePath("/admin/comments");
  }

  async function rejectAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await updateCommentStatus(id, "REJECTED");
    revalidatePath("/admin/comments");
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Модерация Shay ({pending.length})</h1>
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
          Admin
        </span>
      </div>
      
      {pending.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
          <p className="text-gray-500 font-medium">Очередь пуста. Все проверено! ✨</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pending.map((c: PendingComment) => (
            <div key={c.id} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-1 mb-4">
                <span className="text-sm font-bold text-gray-800">
                  {c.author.name || "User"} 
                  <span className="text-gray-400 font-normal ml-2">@{c.author.username}</span>
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  К посту: {c.post?.content?.substring(0, 40) || "..."}...
                </span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl mb-5">
                <p className="text-gray-700 text-lg leading-relaxed italic">
                  "{c.content}"
                </p>
              </div>

              <div className="flex gap-3">
                <form action={approveAction} className="flex-1">
                  <input type="hidden" name="id" value={c.id} />
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-95">
                    Одобрить
                  </button>
                </form>
                
                <form action={rejectAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 px-8 py-3.5 rounded-2xl font-bold transition-all active:scale-95">
                    Удалить
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}