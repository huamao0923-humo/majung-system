import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineMessage, reservationConfirmedMessage } from "@/lib/line";
import { startOfDay, endOfDay } from "@/lib/date";
import { formatDate } from "@/lib/date";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const timeSlotId = searchParams.get("timeSlotId");
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};

  if (date) {
    const d = new Date(date);
    where.date = { gte: startOfDay(d), lte: endOfDay(d) };
  }
  if (timeSlotId) where.timeSlotId = timeSlotId;
  if (userId) where.userId = userId;

  // Non-admins can only see their own
  if (session.user.role !== "admin") {
    where.userId = session.user.id;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: { select: { id: true, displayName: true, pictureUrl: true, phone: true } },
      table: true,
      timeSlot: true,
      payment: true,
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { tableId, timeSlotId, date, guestCount, note } = body;

  if (!tableId || !timeSlotId || !date || !guestCount) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const reservationDate = new Date(date);

  const timeSlot = await prisma.timeSlot.findUnique({ where: { id: timeSlotId } });
  if (!timeSlot) return NextResponse.json({ error: "時段不存在" }, { status: 404 });

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) return NextResponse.json({ error: "桌位不存在" }, { status: 404 });

  // H2: 驗證人數不超過桌位容量
  if (guestCount < 1 || guestCount > table.capacity) {
    return NextResponse.json({ error: `人數必須介於 1 至 ${table.capacity} 人` }, { status: 400 });
  }

  // H1: 黑名單用戶不得訂位
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (currentUser?.isBlacklisted) {
    return NextResponse.json({ error: "帳號已被停用，無法訂位" }, { status: 403 });
  }

  // C1: 用 transaction 包住檢查+建立，防止 race condition
  let reservation;
  try {
    reservation = await prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findFirst({
        where: {
          tableId,
          timeSlotId,
          date: { gte: startOfDay(reservationDate), lte: endOfDay(reservationDate) },
          status: { in: ["pending", "confirmed", "checked_in"] },
        },
      });

      if (existing) {
        throw new Error("CONFLICT");
      }

      const created = await tx.reservation.create({
        data: {
          tenantId: session.user.tenantId,
          userId: session.user.id,
          tableId,
          timeSlotId,
          date: reservationDate,
          guestCount,
          note,
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

  // C2: LINE 推播失敗不影響主流程
  try {
    await sendLineMessage(session.user.lineUserId, [
      reservationConfirmedMessage({
        displayName: session.user.name ?? "會員",
        date: formatDate(reservationDate),
        timeSlotName: timeSlot.name,
        tableName: table.name,
        guestCount,
      }),
    ]);
  } catch (err) {
    console.error("[LINE] 預約確認推播失敗:", err);
  }

  return NextResponse.json(reservation, { status: 201 });
}
