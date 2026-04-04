import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { sendLineMessage, cancelledMessage, waitlistAvailableMessage } from "@/lib/line";
import { startOfDay, endOfDay, formatDate } from "@/lib/date";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const result = await requireTenant(slug);
  if ("error" in result) return result.error;
  const { tenant, session } = result;

  const body = await req.json();
  const { status, note } = body;

  const reservation = await prisma.reservation.findUnique({
    where: { id, tenantId: tenant.id },
    include: { user: true, table: true, timeSlot: true },
  });

  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only admin can change status (except cancel by owner)
  const isOwner = reservation.userId === session.user.id;
  const isAdmin = session.user.role === "admin";

  const validStatuses = ["pending", "confirmed", "cancelled", "checked_in", "no_show"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "無效的狀態值" }, { status: 400 });
  }

  if (!isAdmin && !(isOwner && status === "cancelled")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // T2: 取消截止時間驗證（非 admin）
  if (status === "cancelled" && !isAdmin) {
    const hoursUntil = (reservation.date.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < tenant.cancelDeadlineHours) {
      return NextResponse.json(
        { error: `距離場次不足 ${tenant.cancelDeadlineHours} 小時，無法取消（請聯繫店家）` },
        { status: 400 }
      );
    }
  }

  // T3: no_show 只有 admin 可設定，並累計 noShowCount
  if (status === "no_show") {
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.user.update({
      where: { id: reservation.userId },
      data: { noShowCount: { increment: 1 } },
    });
  }

  const updateData: Record<string, unknown> = { status };
  if (note !== undefined) updateData.note = note;
  if (status === "checked_in") updateData.checkedInAt = new Date();

  const updated = await prisma.reservation.update({
    where: { id, tenantId: tenant.id },
    data: updateData,
    include: { user: true, table: true, timeSlot: true, payment: true },
  });

  // M4: 取消時同步將付款記錄標為 cancelled
  if (status === "cancelled" && updated.payment) {
    await prisma.payment.update({
      where: { id: updated.payment.id },
      data: { status: "cancelled" },
    });
  }

  // Notify on cancel
  if (status === "cancelled") {
    await sendLineMessage(reservation.user.lineUserId, [
      cancelledMessage({
        displayName: reservation.user.displayName,
        date: formatDate(reservation.date),
        timeSlotName: reservation.timeSlot.name,
      }),
    ], tenant.lineMessagingToken);

    // M1: 通知同時段候補名單用戶（同一租戶）
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: {
        tenantId: tenant.id,
        timeSlotId: reservation.timeSlotId,
        date: { gte: startOfDay(reservation.date), lte: endOfDay(reservation.date) },
        notified: false,
      },
      include: { user: true, timeSlot: true },
    });

    for (const entry of waitlistEntries) {
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { notified: true },
      });
      await sendLineMessage(entry.user.lineUserId, [
        waitlistAvailableMessage({
          displayName: entry.user.displayName,
          date: formatDate(entry.date),
          timeSlotName: entry.timeSlot.name,
        }),
      ], tenant.lineMessagingToken);
    }
  }

  return NextResponse.json(updated);
}
