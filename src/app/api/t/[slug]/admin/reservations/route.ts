import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";
import { startOfDay, endOfDay } from "@/lib/date";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const { userId, tableId, timeSlotId, date, guestCount, note } = body;

  if (!userId || !tableId || !timeSlotId || !date || !guestCount) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const [timeSlot, table, user] = await Promise.all([
    prisma.timeSlot.findUnique({ where: { id: timeSlotId, tenantId: tenant.id } }),
    prisma.table.findUnique({ where: { id: tableId, tenantId: tenant.id } }),
    prisma.user.findUnique({ where: { id: userId, tenantId: tenant.id } }),
  ]);

  if (!timeSlot) return NextResponse.json({ error: "時段不存在" }, { status: 404 });
  if (!table) return NextResponse.json({ error: "桌位不存在" }, { status: 404 });
  if (!user) return NextResponse.json({ error: "會員不存在" }, { status: 404 });

  if (guestCount < 1 || guestCount > table.capacity) {
    return NextResponse.json({ error: `人數必須介於 1 至 ${table.capacity} 人` }, { status: 400 });
  }

  const reservationDate = new Date(date);

  let reservation;
  try {
    reservation = await prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findFirst({
        where: {
          tenantId: tenant.id,
          tableId,
          timeSlotId,
          date: { gte: startOfDay(reservationDate), lte: endOfDay(reservationDate) },
          status: { in: ["pending", "confirmed", "checked_in"] },
        },
      });

      if (existing) throw new Error("CONFLICT");

      const created = await tx.reservation.create({
        data: {
          tenantId: tenant.id,
          userId,
          tableId,
          timeSlotId,
          date: reservationDate,
          guestCount,
          note: note ?? null,
          status: "confirmed",
        },
        include: { table: true, timeSlot: true, user: true },
      });

      await tx.payment.create({
        data: {
          reservationId: created.id,
          amount: timeSlot.price,
        },
      });

      return created;
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONFLICT") {
      return NextResponse.json({ error: "此桌位時段已被預約" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json(reservation, { status: 201 });
}
