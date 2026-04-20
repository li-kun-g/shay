// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authMiddleware = withAuth({
  pages: {
    signIn: "/signin",
  },
});

export default function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }
  return authMiddleware(req);
}

export const config = {
  matcher: [
    /*
     * Защищаем все важные разделы, кроме /u/ (профили) и /signin
     */
    "/events/:path*",
    "/campus/:path*",
    "/groups/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/friends/:path*",
    "/settings/:path*",
  ],
};
