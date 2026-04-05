import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 20;

  const where = {
    tenantId: tenant.id,
    role: "member" as const,
    ...(search ? {
      OR: [
        { displayName: { contains: search } },
        { phone: { contains: search } },
      ],
    } : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { reservations: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pageSize });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const { displayName, phone } = await req.json();
  if (!displayName?.trim()) {
    return NextResponse.json({ error: "姓名不得為空" }, { status: 400 });
  }

  const lineUserId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      lineUserId,
      displayName: displayName.trim(),
      phone: phone?.trim() || null,
      role: "member",
    },
    include: { _count: { select: { reservations: true } } },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  // 刪除所有 lineUserId 以 demo_ 開頭的測試用戶
  const deleted = await prisma.user.deleteMany({
    where: {
      tenantId: tenant.id,
      role: "member",
      lineUserId: { startsWith: "demo_" },
    },
  });

  return NextResponse.json({ deleted: deleted.count });
}
