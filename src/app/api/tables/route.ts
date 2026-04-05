import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/date";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const timeSlotId = searchParams.get("timeSlotId");

  const tables = await prisma.table.findMany({
    where: { tenantId: session.user.tenantId, isActive: true },
    orderBy: { order: "asc" },
  });

  if (!date || !timeSlotId) {
    return NextResponse.json(tables);
  }

  const d = new Date(date);
  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId: session.user.tenantId,
      timeSlotId,
      date: { gte: startOfDay(d), lte: endOfDay(d) },
      status: { in: ["pending", "confirmed", "checked_in"] },
    },
  });

  const takenTableIds = new Set(reservations.map((r) => r.tableId));

  return NextResponse.json(tables.map((t) => ({ ...t, isAvailable: !takenTableIds.has(t.id) })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, floorId, capacity = 4, order } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "名稱不能為空" }, { status: 400 });
  }
  if (!floorId) {
    return NextResponse.json({ error: "請指定空間" }, { status: 400 });
  }

  const count = await prisma.table.count({ where: { floorId, tenantId: session.user.tenantId } });
  const table = await prisma.table.create({
    data: {
      name: name.trim(),
      floorId,
      capacity,
      order: order ?? count,
      tenantId: session.user.tenantId,
    },
  });
  return NextResponse.json(table, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const existing = await prisma.table.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const active = await prisma.reservation.count({
    where: { tableId: id, status: { in: ["pending", "confirmed", "checked_in"] } },
  });
  if (active > 0) {
    return NextResponse.json({ error: "此桌位有進行中的預約，無法刪除" }, { status: 400 });
  }

  await prisma.table.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...data } = body;

  const existing = await prisma.table.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const table = await prisma.table.update({ where: { id }, data });
  return NextResponse.json(table);
}
