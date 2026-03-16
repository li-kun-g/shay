// app/admin/moderation/page.tsx
import { prisma } from "@/lib/prisma";
import { approvePost, rejectPost } from "@/app/actions/moderation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

export default async function ModerationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isOfficial: true },
  });

  if (!dbUser || dbUser.isOfficial !== true) {
    notFound(); 
  }

  const pendingPosts = await prisma.post.findMany({
    where: { status: "PENDING" },
    // Removed author inclusion to keep things private
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">Moderation Queue ({pendingPosts.length})</h1>
      
      {pendingPosts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <p className="text-gray-500">The queue is empty. Grab a coffee! ☕</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPosts.map((post) => (
            <div key={post.id} className="p-4 border rounded-xl bg-white shadow-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span className="font-medium uppercase tracking-wider">Pending Anonymous Spill</span>
                <span>{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              
              <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
              
              {post.imageUrl && (
                <img 
                  src={post.imageUrl} 
                  alt="Attached" 
                  className="mb-4 rounded-lg max-h-60 w-full object-cover" 
                />
              )}

              <div className="flex gap-3">
                <form action={async () => {
                  "use server";
                  await approvePost(post.id);
                }}>
                  <button 
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Approve
                  </button>
                </form>

                <form action={async () => {
                  "use server";
                  await rejectPost(post.id);
                }}>
                  <button 
                    type="submit"
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
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