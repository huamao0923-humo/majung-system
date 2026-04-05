import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const COOKIE_NAME = IS_PRODUCTION ? "__Secure-authjs.session-token" : "authjs.session-token";

// Simple in-memory rate limiter
// TODO: For multi-instance deployments (e.g. Vercel), replace with Upstash Redis rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  if (entry.count > limit) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET ?? "development-secret";

  const token = await getToken({ req, secret, salt: COOKIE_NAME, cookieName: COOKIE_NAME });

  // ── Rate limiting ─────────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  // /superadmin/login POST: 10 attempts per 15 minutes per IP
  if (pathname === "/superadmin/login" && req.method === "POST") {
    if (isRateLimited(`superadmin-login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // /api/t/*/reservations POST: 20 requests per minute per IP
  if (/^\/api\/t\/[^/]+\/reservations$/.test(pathname) && req.method === "POST") {
    if (isRateLimited(`reservations-post:${ip}`, 20, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // ── 超級後台 ──────────────────────────────────────────────
  if (pathname.startsWith("/superadmin")) {
    if (pathname === "/superadmin/login") return NextResponse.next();
    if (!token || token.role !== "superadmin") {
      return NextResponse.redirect(new URL("/superadmin/login", req.url));
    }
    return NextResponse.next();
  }

  // ── 租戶路由 /t/[slug]/... ────────────────────────────────
  const tenantMatch = pathname.match(/^\/t\/([^/]+)(\/.*)?$/);
  if (tenantMatch) {
    const slug = tenantMatch[1];
    const subPath = tenantMatch[2] ?? "/";

    // 租戶 admin
    if (subPath.startsWith("/admin")) {
      if (!token) {
        const res = NextResponse.redirect(new URL("/admin-login", req.url));
        res.cookies.set("x-tenant-slug", slug, { path: "/", httpOnly: true, sameSite: "lax" });
        return res;
      }
      if (token.role === "superadmin") {
        // superadmin 可存取任何租戶後台
        const res = NextResponse.next();
        res.cookies.set("x-tenant-slug", slug, { path: "/", httpOnly: true, sameSite: "lax" });
        return res;
      }
      if (token.role !== "admin") {
        return NextResponse.redirect(new URL(`/t/${slug}`, req.url));
      }
      // 租戶管理員：tenantSlug 必須與 URL slug 一致
      if (token.tenantSlug && token.tenantSlug !== slug) {
        return NextResponse.redirect(new URL(`/t/${token.tenantSlug as string}/admin`, req.url));
      }
    }

    // 需登入的會員頁面
    if (
      subPath.startsWith("/reserve") ||
      subPath.startsWith("/my-reservations") ||
      subPath.startsWith("/profile")
    ) {
      if (!token) {
        const res = NextResponse.redirect(new URL(`/t/${slug}/login`, req.url));
        res.cookies.set("x-tenant-slug", slug, { path: "/", httpOnly: true, sameSite: "lax" });
        return res;
      }
    }

    // 每次訪問租戶頁面都刷新 slug cookie（供 auth callback 用）
    const res = NextResponse.next();
    res.cookies.set("x-tenant-slug", slug, { path: "/", httpOnly: true, sameSite: "lax" });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*", "/t/:path*", "/api/t/:path*"],
};
