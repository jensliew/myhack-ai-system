import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { UserRole } from "@/types/user.types";

/**
 * Cookie name used for auth session data.
 * Contains JSON with { uid, role } set by the auth service on login/register.
 */
const AUTH_COOKIE_NAME = "nexora-auth";

/**
 * Routes that do not require authentication.
 */
const PUBLIC_ROUTES = ["/login", "/register", "/"];

/**
 * Role-to-route prefix mapping for protected dashboard routes.
 */
const ROLE_ROUTE_MAP: Record<UserRole, string> = {
  admin: "/admin",
  startup: "/startup",
  mentor: "/mentor",
};

/**
 * All protected route prefixes that require specific roles.
 */
const PROTECTED_PREFIXES = ["/admin", "/startup", "/mentor"];

interface AuthCookiePayload {
  uid: string;
  role: UserRole;
}

/**
 * Parses the nexora-auth cookie and returns the payload, or null if invalid.
 */
function parseAuthCookie(
  request: NextRequest
): AuthCookiePayload | null {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const payload = JSON.parse(cookie.value) as AuthCookiePayload;
    if (payload.uid && payload.role && payload.role in ROLE_ROUTE_MAP) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Determines if a pathname is a public route (no auth required).
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

/**
 * Determines if a pathname is a protected route requiring a specific role.
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Gets the required role for a given protected route pathname.
 */
function getRequiredRole(pathname: string): UserRole | null {
  for (const [role, prefix] of Object.entries(ROLE_ROUTE_MAP)) {
    if (pathname.startsWith(prefix)) {
      return role as UserRole;
    }
  }
  return null;
}

/**
 * Next.js 16 Proxy (formerly middleware) for route protection.
 *
 * - Public routes (/login, /register, /) bypass auth checks
 * - Protected routes (/admin/*, /startup/*, /mentor/*) require authentication
 * - Unauthenticated users are redirected to /login
 * - Authenticated users with role mismatch are redirected to their own dashboard
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes: no auth check needed
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Only apply auth logic to protected routes
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Parse auth cookie
  const authPayload = parseAuthCookie(request);

  // Unauthenticated: redirect to /login
  if (!authPayload) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const requiredRole = getRequiredRole(pathname);

  if (requiredRole && authPayload.role !== requiredRole) {
    // Role mismatch: redirect to user's own dashboard
    const userDashboard = ROLE_ROUTE_MAP[authPayload.role];
    const redirectUrl = new URL(userDashboard, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated with correct role: allow access
  return NextResponse.next();
}

/**
 * Matcher config: only run proxy on protected dashboard routes.
 * Excludes API routes, static files, and image optimization.
 */
export const config = {
  matcher: ["/admin/:path*", "/startup/:path*", "/mentor/:path*"],
};
