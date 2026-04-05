import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineMessage, cancelledMessage, waitlistAvailableMessage } from "@/lib/line";
import { startOfDay, endOfDay } from "@/lib/date";
import { formatDate } from "@/lib/date";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, note } = body;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { user: true, table: true, timeSlot: true },
  });

  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = reservation.userId === session.user.id;
  const isAdmin = session.user.role === "admin";

  // 確認預約屬於同一租戶
  if (isAdmin && reservation.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isOwner && reservation.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdmin && !(isOwner && status === "cancelled")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = { status };
  if (note !== undefined) updateData.note = note;
  if (status === "checked_in") updateData.checkedInAt = new Date();

  const updated = await prisma.reservation.update({
    where: { id },
    data: updateData,
    include: { user: true, table: true, timeSlot: true, payment: true },
  });

  if (status === "cancelled" && updated.payment) {
    await prisma.payment.update({
      where: { id: updated.payment.id },
      data: { status: "cancelled" },
    });
  }

  if (status === "cancelled") {
    try {
      await sendLineMessage(reservation.user.lineUserId, [
        cancelledMessage({
          displayName: reservation.user.displayName,
          date: formatDate(reservation.date),
          timeSlotName: reservation.timeSlot.name,
        }),
      ]);
    } catch (err) {
      console.error("[LINE] 取消通知推播失敗:", err);
    }

    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: {
        timeSlotId: reservation.timeSlotId,
        date: { gte: startOfDay(reservation.date), lte: endOfDay(reservation.date) },
        notified: false,
      },
      include: { user: true, timeSlot: true },
    });

    for (const entry of waitlistEntries) {
      await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { notified: true } });
      try {
        await sendLineMessage(entry.user.lineUserId, [
          waitlistAvailableMessage({
            displayName: entry.user.displayName,
            date: formatDate(entry.date),
            timeSlotName: entry.timeSlot.name,
          }),
        ]);
      } catch (err) {
        console.error("[LINE] 候補通知推播失敗:", err);
      }
    }
  }

  return NextResponse.json(updated);
}
