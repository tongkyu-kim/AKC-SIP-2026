import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Shared-password gate for the whole dashboard, since it holds sensitive
// contact details (ambassador phone numbers/emails, etc). Set SITE_PASSWORD
// in the Vercel project's environment variables (Production + Preview) —
// never commit it. Local dev is left open when the var isn't set.
export function proxy(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) return NextResponse.next();

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const password = decoded.slice(decoded.indexOf(":") + 1);
    if (password === sitePassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AKC-SIP-2026"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
