import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export type TenantInfo = {
  id: string;
  name: string;
  slug: string;
  lineChannelId: string | null;
  lineChannelSecret: string | null;
  lineMessagingToken: string | null;
  lineLiffId: string | null;
  isActive: boolean;
  plan: string;
  cancelDeadlineHours: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
};

/** 從 slug 取得租戶，找不到或已停用則回傳 null */
export async function getTenant(slug: string): Promise<TenantInfo | null> {
  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      lineChannelId: true,
      lineChannelSecret: true,
      lineMessagingToken: true,
      lineLiffId: true,
      isActive: true,
      plan: true,
      cancelDeadlineHours: true,
      minAdvanceHours: true,
      maxAdvanceDays: true,
    },
  });
}

/**
 * API route 用：取得租戶 + 驗證已登入。
 * 回傳 { tenant, session } 或 NextResponse error。
 */
export async function requireTenant(slug: string) {
  const session = await auth();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const tenant = await getTenant(slug);
  if (!tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  }
  if (!tenant.isActive) {
    return { error: NextResponse.json({ error: "Service suspended" }, { status: 403 }) };
  }
  if (session.user.tenantId !== tenant.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { tenant, session };
}

/**
 * API route 用：取得租戶 + 驗證 admin 權限。
 */
export async function requireAdmin(slug: string) {
  const result = await requireTenant(slug);
  if ("error" in result) return result;

  if (result.session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return result;
}
