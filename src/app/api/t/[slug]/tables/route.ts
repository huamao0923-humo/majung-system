import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant, requireAdmin } from "@/lib/tenant";
import { startOfDay, endOfDay } from "@/lib/date";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireTenant(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const timeSlotId = searchParams.get("timeSlotId");

  const tables = await prisma.table.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { order: "asc" },
  });

  if (!date || !timeSlotId) {
    return NextResponse.json(tables);
  }

  // Get reservations for this date/timeslot to show availability
  const d = new Date(date);
  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId: tenant.id,
      timeSlotId,
      date: { gte: startOfDay(d), lte: endOfDay(d) },
      status: { in: ["pending", "confirmed", "checked_in"] },
    },
  });

  const takenTableIds = new Set(reservations.map((r) => r.tableId));

  const tablesWithAvailability = tables.map((t) => ({
    ...t,
    isAvailable: !takenTableIds.has(t.id),
  }));

  return NextResponse.json(tablesWithAvailability);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const { floorId, name, capacity, order, posX, posY, tableWidth, tableHeight } = body;

  if (!floorId || !name || !capacity) {
    return NextResponse.json({ error: "缺少必要欄位 (floorId, name, capacity)" }, { status: 400 });
  }

  const table = await prisma.table.create({
    data: {
      tenantId: tenant.id,
      floorId,
      name,
      capacity,
      order: order ?? 0,
      posX: posX ?? 0,
      posY: posY ?? 0,
      tableWidth: tableWidth ?? 100,
      tableHeight: tableHeight ?? 100,
    },
  });

  return NextResponse.json(table, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const { id, name, capacity, isActive, posX, posY, tableWidth, tableHeight } = body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (capacity !== undefined) data.capacity = capacity;
  if (isActive !== undefined) data.isActive = isActive;
  if (posX !== undefined) data.posX = posX;
  if (posY !== undefined) data.posY = posY;
  if (tableWidth !== undefined) data.tableWidth = tableWidth;
  if (tableHeight !== undefined) data.tableHeight = tableHeight;

  const table = await prisma.table.update({
    where: { id, tenantId: tenant.id },
    data,
  });

  return NextResponse.json(table);
}
