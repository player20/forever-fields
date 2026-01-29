import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Demo mode for local development - bypass auth checks
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Routes that require authentication
// Note: /create is NOT protected - anyone can create a memorial
// They'll be prompted to sign up after creation to save their work
const protectedRoutes = [
  "/dashboard",
  "/settings",
  "/memorial/*/edit",
  "/memorial/*/settings",
];

// Routes that should redirect authenticated users (auth pages)
const authRoutes = ["/login", "/signup", "/reset-password"];

// Check if a path matches any protected route pattern
function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some((route) => {
    // Convert wildcard pattern to regex
    const pattern = route.replace(/\*/g, "[^/]+");
    const regex = new RegExp(`^${pattern}(/|$)`);
    return regex.test(path);
  });
}

// Check if a path is an auth route
function isAuthRoute(path: string): boolean {
  return authRoutes.some((route) => path.startsWith(route));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // In demo mode, skip all auth checks
  if (DEMO_MODE) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const token = request.cookies.get("auth_token")?.value;
  const isAuthenticated = !!token;

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname) && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - API routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\..*|api).*)",
  ],
};
