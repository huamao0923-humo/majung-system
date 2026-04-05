import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // 確認會員屬於該管理員的租戶
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: "不能對自己操作" }, { status: 400 });
  }

  const { isBlacklisted, displayName, phone, noShowCount } = body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(isBlacklisted !== undefined ? { isBlacklisted: Boolean(isBlacklisted) } : {}),
      ...(displayName !== undefined ? { displayName: String(displayName).trim() } : {}),
      ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
      ...(noShowCount !== undefined ? { noShowCount: parseInt(noShowCount) || 0 } : {}),
    },
    include: { _count: { select: { reservations: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // 確認會員屬於該管理員的租戶
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: "不能刪除自己" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
