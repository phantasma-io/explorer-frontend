import { NextRequest, NextResponse } from "next/server";

const LEGACY_LOCALES = new Set(["en", "de", "pt"]);

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return NextResponse.next();
  }

  const [locale, ...rest] = segments;
  if (!LEGACY_LOCALES.has(locale)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (rest.length === 0) {
    // Strip the locale prefix entirely for root links like /en.
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const [first, ...tail] = rest;

  if (first === "transaction") {
    // Legacy transaction links were query-based or /transaction/<hash>.
    const hash = searchParams.get("id") ?? searchParams.get("hash") ?? tail[0];
    if (hash) {
      url.pathname = `/tx/${hash}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (first === "block") {
    // Legacy block links were query-based or /block/<height>.
    const height = searchParams.get("id") ?? searchParams.get("height") ?? tail[0];
    if (height) {
      url.pathname = `/block/${height}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Default: strip the locale prefix and keep the rest of the path + query.
  url.pathname = `/${rest.join("/")}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/:path*"],
};
