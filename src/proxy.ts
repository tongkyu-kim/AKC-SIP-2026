import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_AUTH_COOKIE } from "@/lib/auth";

// Shared-password gate for the whole dashboard, since it holds sensitive
// contact details (ambassador phone numbers/emails, etc). Set SITE_PASSWORD
// in the Vercel project's environment variables (Production + Preview) —
// never commit it. Local dev is left open when the var isn't set.
export function proxy(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) return NextResponse.next();

  // The login page (and the server action that posts back to it) must stay
  // reachable, or nobody could ever get past the gate.
  if (request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SITE_AUTH_COOKIE);
  if (cookie?.value === sitePassword) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
