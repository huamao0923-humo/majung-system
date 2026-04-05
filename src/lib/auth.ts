import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    // ── SuperAdmin credentials login ──────────────────────────────
    Credentials({
      id: "superadmin-credentials",
      name: "SuperAdmin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const admin = await prisma.superAdmin.findUnique({
          where: { username: credentials.username as string },
        });
        if (!admin) return null;
        const valid = await bcrypt.compare(credentials.password as string, admin.passwordHash);
        if (!valid) return null;
        return { id: admin.id, name: admin.username, email: null, role: "superadmin" } as never;
      },
    }),
    // ── 租戶管理員 credentials login ─────────────────────────────
    Credentials({
      id: "tenant-admin",
      name: "TenantAdmin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: { tenant: { select: { slug: true, isActive: true } } },
        });
        if (!user || user.role !== "admin" || !user.passwordHash) return null;
        if (!user.tenant.isActive) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.displayName,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          role: "admin",
        } as never;
      },
    }),
    // ── LINE OAuth ────────────────────────────────────────────────
    {
      id: "line",
      name: "LINE",
      type: "oauth",
      authorization: {
        url: "https://access.line.me/oauth2/v2.1/authorize",
        params: { scope: "profile openid", response_type: "code" },
      },
      token: "https://api.line.me/oauth2/v2.1/token",
      userinfo: "https://api.line.me/v2/profile",
      clientId: process.env.LINE_CHANNEL_ID,
      clientSecret: process.env.LINE_CHANNEL_SECRET,
      profile(profile) {
        return {
          id: profile.userId,
          name: profile.displayName,
          image: profile.pictureUrl,
          lineUserId: profile.userId,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Allow credentials (superadmin) login to pass through
      if (account?.provider === "superadmin-credentials") return true;
      if (!profile?.sub && !profile?.userId) return false;
      const lineUserId = (profile.userId || profile.sub) as string;
      const displayName = (profile.displayName || profile.name) as string;
      const pictureUrl = (profile.pictureUrl || profile.picture) as string | undefined;

      // 從 cookie 取得當前租戶 slug
      const cookieStore = await cookies();
      const tenantSlug = cookieStore.get("x-tenant-slug")?.value;

      if (!tenantSlug) return false;

      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (!tenant || !tenant.isActive) return false;

      await prisma.user.upsert({
        where: { tenantId_lineUserId: { tenantId: tenant.id, lineUserId } },
        update: { displayName, pictureUrl },
        create: { tenantId: tenant.id, lineUserId, displayName, pictureUrl },
      });

      return true;
    },

    async session({ session, token }) {
      if (token.lineUserId && token.tenantId) {
        const user = await prisma.user.findUnique({
          where: {
            tenantId_lineUserId: {
              tenantId: token.tenantId as string,
              lineUserId: token.lineUserId as string,
            },
          },
        });
        if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.lineUserId = user.lineUserId;
          session.user.tenantId = user.tenantId;
          session.user.phone = user.phone ?? undefined;
        }
      }
      // superadmin session
      if (token.role === "superadmin") {
        session.user.role = "superadmin";
        session.user.id = token.userId as string;
      }
      // tenant-admin session（credentials 登入，tenantSlug 存在 token）
      if (token.tenantSlug) {
        session.user.tenantSlug = token.tenantSlug as string;
      }
      return session;
    },

    async jwt({ token, user, profile }) {
      // superadmin credentials login
      if (user && (user as never as { role: string }).role === "superadmin") {
        token.role = "superadmin";
        token.userId = user.id;
        return token;
      }
      // tenant-admin credentials login
      if (user && (user as never as { role: string }).role === "admin" && (user as never as { tenantSlug?: string }).tenantSlug) {
        token.role = "admin";
        token.userId = user.id;
        token.tenantId = (user as never as { tenantId: string }).tenantId;
        token.tenantSlug = (user as never as { tenantSlug: string }).tenantSlug;
        return token;
      }

      if (profile) {
        const lineUserId = (profile.userId || profile.sub) as string;
        token.lineUserId = lineUserId;

        // 讀取租戶（從 token 中若已有 tenantId 就用，否則需要 signIn 流程已設定）
      }

      // 每次都從 DB re-fetch role + tenantId
      if (token.lineUserId && token.tenantId) {
        const dbUser = await prisma.user.findUnique({
          where: {
            tenantId_lineUserId: {
              tenantId: token.tenantId as string,
              lineUserId: token.lineUserId as string,
            },
          },
          select: { id: true, role: true, tenantId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.userId = dbUser.id;
        }
      } else if (token.lineUserId && !token.tenantId) {
        // 第一次登入，tenantId 需從 signIn cookie 取得
        // 此時 signIn callback 已經用正確 tenantId 建立 user，
        // 嘗試從最新建立的 user 取得 tenantId
        const dbUser = await prisma.user.findFirst({
          where: { lineUserId: token.lineUserId as string },
          orderBy: { createdAt: "desc" },
          select: { id: true, role: true, tenantId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.userId = dbUser.id;
          token.tenantId = dbUser.tenantId;
        }
      }

      return token;
    },
  },
  pages: {
    signIn: "/login", // fallback，實際由 /t/[slug]/login 處理
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Extend types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      lineUserId: string;
      tenantId: string;
      tenantSlug?: string;
      phone?: string;
    };
  }
}
