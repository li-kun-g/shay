// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
});

export const config = {
  matcher: [
    /*
     * Защищаем все важные разделы, кроме /u/ (профили) и /signin
     */
    "/",
    "/events/:path*",
    "/campus/:path*",
    "/groups/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/friends/:path*",
    "/settings/:path*",
  ],
};