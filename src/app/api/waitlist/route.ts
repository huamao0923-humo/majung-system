import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/date";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { timeSlotId, date, guestCount } = body;

  if (!timeSlotId || !date || !guestCount) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const d = new Date(date);

  // Check not already on waitlist
  const existing = await prisma.waitlistEntry.findFirst({
    where: {
      userId: session.user.id,
      timeSlotId,
      date: { gte: startOfDay(d), lte: endOfDay(d) },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "已在候補名單中" }, { status: 409 });
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      timeSlotId,
      date: d,
      guestCount,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const timeSlotId = searchParams.get("timeSlotId");

  const where: Record<string, unknown> = {};
  if (date) {
    const d = new Date(date);
    where.date = { gte: startOfDay(d), lte: endOfDay(d) };
  }
  if (timeSlotId) where.timeSlotId = timeSlotId;
  if (session.user.role !== "admin") where.userId = session.user.id;

  const entries = await prisma.waitlistEntry.findMany({
    where,
    include: {
      user: { select: { displayName: true, phone: true, pictureUrl: true } },
      timeSlot: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(entries);
}
