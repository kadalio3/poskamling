import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isPublicPath = req.nextUrl.pathname === "/";

  // Jika sudah login dan mencoba akses halaman auth, redirect ke dashboard
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Jika belum login dan mencoba akses route privat, redirect ke signin
  if (!isLoggedIn && !isAuthPage && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match semua route kecuali:
     * - api auth endpoints
     * - static files
     * - images
     * - favicon
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
