import { NextRequest, NextResponse } from "next/server";
import { resolveLegacyRedirect } from "@/lib/legacy-compat/resolve-redirect";

export function proxy(request: NextRequest) {
  const legacyTarget = resolveLegacyRedirect(request.nextUrl);
  if (!legacyTarget) {
    return NextResponse.next();
  }

  if (
    legacyTarget.pathname === request.nextUrl.pathname &&
    legacyTarget.search === request.nextUrl.search
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = legacyTarget.pathname;
  url.search = legacyTarget.search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/:path*"],
};
