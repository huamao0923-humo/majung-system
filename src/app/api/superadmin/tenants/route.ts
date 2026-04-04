import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";

// GET /api/superadmin/tenants
export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, reservations: true } },
    },
  });

  return NextResponse.json(tenants);
}

// POST /api/superadmin/tenants
export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, slug, lineChannelId, lineChannelSecret, lineMessagingToken, lineLiffId, plan } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "館名和 Slug 為必填" }, { status: 400 });
  }

  // Check slug uniqueness
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug 已被使用" }, { status: 400 });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      lineChannelId: lineChannelId || null,
      lineChannelSecret: lineChannelSecret || null,
      lineMessagingToken: lineMessagingToken || null,
      lineLiffId: lineLiffId || null,
      plan: plan ?? "basic",
      isActive: true,
    },
  });

  return NextResponse.json(tenant, { status: 201 });
}
