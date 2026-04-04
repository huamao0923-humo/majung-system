import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";

// GET /api/superadmin/tenants/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, reservations: true } },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "租戶不存在" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

// PATCH /api/superadmin/tenants/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const {
    name,
    slug,
    lineChannelId,
    lineChannelSecret,
    lineMessagingToken,
    lineLiffId,
    isActive,
    plan,
  } = body;

  // Check slug uniqueness if changing
  if (slug) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Slug 已被使用" }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (slug !== undefined) data.slug = slug;
  if (lineChannelId !== undefined) data.lineChannelId = lineChannelId || null;
  if (lineChannelSecret !== undefined) data.lineChannelSecret = lineChannelSecret || null;
  if (lineMessagingToken !== undefined) data.lineMessagingToken = lineMessagingToken || null;
  if (lineLiffId !== undefined) data.lineLiffId = lineLiffId || null;
  if (isActive !== undefined) data.isActive = isActive;
  if (plan !== undefined) data.plan = plan;

  const tenant = await prisma.tenant.update({
    where: { id },
    data,
    include: {
      _count: { select: { users: true, reservations: true } },
    },
  });

  return NextResponse.json(tenant);
}

// DELETE /api/superadmin/tenants/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;

  await prisma.tenant.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
