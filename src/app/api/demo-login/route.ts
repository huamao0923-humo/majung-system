import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { role } = await req.json();

  if (!["member", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // 取得預設租戶
  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  if (!tenant) {
    return NextResponse.json({ error: "尚未建立租戶，請先執行 npm run db:seed" }, { status: 500 });
  }

  const lineUserId = `demo_${role}_${Date.now()}`;
  const displayName = role === "admin" ? "測試管理員" : "測試會員";

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      lineUserId,
      displayName,
      role,
      phone: "0912345678",
    },
  });

  const secret = process.env.NEXTAUTH_SECRET ?? "development-secret";
  const cookieName = "authjs.session-token";

  const token = await encode({
    token: {
      sub: user.lineUserId,
      lineUserId: user.lineUserId,
      tenantId: user.tenantId,
      role: user.role,
      userId: user.id,
      name: user.displayName,
    },
    secret,
    salt: cookieName,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.json({ ok: true, role });
}
