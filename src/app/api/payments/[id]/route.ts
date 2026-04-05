import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineMessage, paymentConfirmedMessage } from "@/lib/line";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, method, amount, note } = body;

  // 確認付款記錄屬於該管理員的租戶
  const existing = await prisma.payment.findUnique({
    where: { id },
    include: { reservation: { select: { tenantId: true } } },
  });
  if (!existing || existing.reservation.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status,
      method,
      amount,
      note,
      paidAt: status === "paid" ? new Date() : undefined,
      confirmedBy: session.user.id,
    },
    include: {
      reservation: {
        include: { user: true },
      },
    },
  });

  if (status === "paid") {
    await prisma.reservation.update({
      where: { id: payment.reservationId },
      data: { status: "completed" },
    });

    const lineUserId = payment.reservation.user?.lineUserId;
    if (lineUserId) {
      try {
        await sendLineMessage(lineUserId, [
          paymentConfirmedMessage({
            displayName: payment.reservation.user.displayName,
            amount: payment.amount,
            method: method ?? "現金",
          }),
        ]);
      } catch (err) {
        console.error("[LINE] 付款確認推播失敗:", err);
      }
    }
  }

  return NextResponse.json(payment);
}
