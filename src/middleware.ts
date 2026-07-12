import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Page mapping and allowed roles
// Fleet Manager can access everything.
const ROLE_PERMISSIONS: Record<string, string[]> = {
  "Fleet Manager": [
    "/dashboard",
    "/fleet",
    "/drivers",
    "/trips",
    "/maintenance",
    "/expenses",
    "/analytics",
    "/settings",
  ],
  "Dispatcher": [
    "/dashboard",
    "/fleet",
    "/drivers",
    "/trips",
    "/maintenance",
  ],
  "Safety Officer": [
    "/dashboard",
    "/fleet",
    "/drivers",
    "/maintenance",
  ],
  "Financial Analyst": [
    "/dashboard",
    "/fleet",
    "/expenses",
    "/analytics",
  ],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, images, next internal routes, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("session")?.value;

  // If not logged in
  if (!sessionCookie) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // If logged in and trying to access login
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Parse session
  try {
    const session = JSON.parse(sessionCookie) as {
      id: number;
      email: string;
      name: string;
      role: string;
    };

    const userRole = session.role;
    const allowedPaths = ROLE_PERMISSIONS[userRole] || ["/dashboard"];

    // Check if the user is allowed to access the current pathname
    const isAllowed = allowedPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));

    if (!isAllowed) {
      // Redirect to dashboard with unauthorized error flag
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // Bad cookie format, clear and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
