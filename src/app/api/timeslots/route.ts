import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSession() {
  const session = await auth();
  if (!session || !session.user.tenantId) return null;
  return session;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slots = await prisma.timeSlot.findMany({
    where: { tenantId: session.user.tenantId, isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, startTime, endTime, price, order, isActive } = body;
  const slot = await prisma.timeSlot.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      startTime,
      endTime,
      price: price ?? 0,
      order: order ?? 0,
      isActive: isActive ?? true,
    },
  });
  return NextResponse.json(slot, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, ...data } = body;

  // 確認此時段屬於該管理員的租戶
  const existing = await prisma.timeSlot.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slot = await prisma.timeSlot.update({ where: { id }, data });
  return NextResponse.json(slot);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  // 確認此時段屬於該管理員的租戶
  const existing = await prisma.timeSlot.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 有未完成預約則不允許刪除
  const active = await prisma.reservation.count({
    where: { timeSlotId: id, status: { in: ["pending", "confirmed", "checked_in"] } },
  });
  if (active > 0) {
    return NextResponse.json({ error: "此時段有進行中的預約，無法刪除" }, { status: 400 });
  }

  await prisma.timeSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
