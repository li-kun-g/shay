// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

export const ourFileRouter = {
  /**
   * USER AVATAR
   * - Uploading here will automatically update User.image
   * - Use ONLY for profile avatar uploader
   */
  avatarImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const userId = await requireUserId();
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { image: file.url },
      });
      return { url: file.url, key: file.key };
    }),

  /**
   * EVENT IMAGE
   * - Uploads to CDN
   * - Does NOT write to DB here
   */
  eventImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const userId = await requireUserId();
      return { userId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key };
    }),

  /**
   * GROUP IMAGE
   * - Uploads to CDN
   * - Does NOT touch User.image
   * - Your group edit form/action should save the returned URL to Group.image
   */
  groupImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const userId = await requireUserId();
      return { userId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key };
    }),

  /**
   * POST IMAGE (✅ NEW)
   * - Uploads to CDN
   * - Does NOT write to DB here
   * - createPost action will store imageUrl/imageKey (non-anon only)
   */
  postImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const userId = await requireUserId();
      return { userId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;