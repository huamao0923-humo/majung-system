import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { sendLineMessage, reservationConfirmedMessage } from "@/lib/line";
import { startOfDay, endOfDay, formatDate } from "@/lib/date";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireTenant(slug);
  if ("error" in result) return result.error;
  const { tenant, session } = result;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const timeSlotId = searchParams.get("timeSlotId");
  const userId = searchParams.get("userId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { tenantId: tenant.id };

  if (date) {
    const d = new Date(date);
    where.date = { gte: startOfDay(d), lte: endOfDay(d) };
  }
  if (timeSlotId) where.timeSlotId = timeSlotId;
  if (userId) where.userId = userId;

  const isAdmin = session.user.role === "admin";

  // Non-admins can only see their own
  if (!isAdmin) {
    where.userId = session.user.id;
  }

  // Admin search by user displayName or phone
  if (search && isAdmin) {
    where.user = {
      OR: [
        { displayName: { contains: search } },
        { phone: { contains: search } },
      ],
    };
  }

  const includeClause = {
    user: { select: { id: true, displayName: true, pictureUrl: true, phone: true } },
    table: true,
    timeSlot: true,
    payment: true,
  };
  const orderByClause = [{ date: "asc" as const }, { createdAt: "asc" as const }];

  if (isAdmin) {
    const [reservations, total] = await prisma.$transaction([
      prisma.reservation.findMany({
        where,
        include: includeClause,
        orderBy: orderByClause,
        skip,
        take: pageSize,
      }),
      prisma.reservation.count({ where }),
    ]);
    return NextResponse.json({ reservations, total, page, pageSize });
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: includeClause,
    orderBy: orderByClause,
  });

  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireTenant(slug);
  if ("error" in result) return result.error;
  const { tenant, session } = result;

  const body = await req.json();
  const { tableId, timeSlotId, date, guestCount, note } = body;

  if (!tableId || !timeSlotId || !date || !guestCount) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  const reservationDate = new Date(date);

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: timeSlotId, tenantId: tenant.id },
  });
  if (!timeSlot) return NextResponse.json({ error: "時段不存在" }, { status: 404 });

  const table = await prisma.table.findUnique({
    where: { id: tableId, tenantId: tenant.id },
  });
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

  // B1: 訂位時間規則驗證
  const now = new Date();

  // 1. 不能訂過去的日期
  if (reservationDate < now) {
    return NextResponse.json({ error: "不能訂過去的時間" }, { status: 400 });
  }

  // 2. 最少提前幾小時
  const hoursUntil = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil < tenant.minAdvanceHours) {
    return NextResponse.json({ error: `請至少提前 ${tenant.minAdvanceHours} 小時訂位` }, { status: 400 });
  }

  // 3. 最多提前幾天
  const daysUntil = hoursUntil / 24;
  if (daysUntil > tenant.maxAdvanceDays) {
    return NextResponse.json({ error: `最多只能提前 ${tenant.maxAdvanceDays} 天訂位` }, { status: 400 });
  }

  // 4. 檢查是否為休息日
  const dateStr = reservationDate.toISOString().split("T")[0];
  const closedDate = await prisma.closedDate.findUnique({
    where: { tenantId_date: { tenantId: tenant.id, date: dateStr } },
  });
  if (closedDate) {
    return NextResponse.json(
      { error: `${dateStr} 為休息日${closedDate.reason ? `（${closedDate.reason}）` : ""}，無法訂位` },
      { status: 400 }
    );
  }

  // C1: 用 transaction 包住檢查+建立，防止 race condition
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

      if (existing) {
        throw new Error("CONFLICT");
      }

      const created = await tx.reservation.create({
        data: {
          tenantId: tenant.id,
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
    ], tenant.lineMessagingToken);
  } catch (err) {
    console.error("[LINE] 預約確認推播失敗:", err);
  }

  return NextResponse.json(reservation, { status: 201 });
}
