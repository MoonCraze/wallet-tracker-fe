export { default } from "next-auth/middleware";

export const config = {
  // Only protect routes that need authentication
  // SSE streams and public pages are not protected
  matcher: [
    "/transfers/:path*",
    "/coordinated/:path*",
    "/analytics/:path*",
    "/config/:path*",
    "/admin/:path*",
  ],
};
