import { NextRequest, NextResponse } from "next/server";

const tenantOnly = ["/locataire", "/mon-loyer", "/services", "/technicien", "/signaler"];
const ownerOnly = ["/dashboard", "/biens", "/locataires", "/paiements", "/incidents"];

function matches(pathname: string, prefixes: string[]) { return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)); }

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("bailio-role")?.value;
  if (role === "locataire" && matches(pathname, ownerOnly)) return NextResponse.redirect(new URL("/locataire/dashboard", request.url));
  if (role === "proprietaire" && matches(pathname, tenantOnly)) return NextResponse.redirect(new URL("/dashboard", request.url));
  if (matches(pathname, ["/locataire"]) && role && role !== "locataire") return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/biens/:path*", "/locataires/:path*", "/paiements/:path*", "/incidents/:path*", "/locataire/:path*", "/mon-loyer/:path*", "/services/:path*", "/technicien/:path*", "/signaler/:path*"] };
