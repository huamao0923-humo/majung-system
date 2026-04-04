import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const slots = await prisma.timeSlot.findMany({
    where: { isActive: true },
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
  const slot = await prisma.timeSlot.create({ data: body });
  return NextResponse.json(slot, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, ...data } = body;
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
