import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";
import { sendLineMessage, paymentConfirmedMessage } from "@/lib/line";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant, session } = result;

  const body = await req.json();
  const { status, method, amount, note } = body;

  // Verify payment belongs to this tenant via its reservation
  const existingPayment = await prisma.payment.findUnique({
    where: { id },
    include: { reservation: { select: { tenantId: true } } },
  });

  if (!existingPayment || existingPayment.reservation.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  // Mark reservation as completed when paid
  if (status === "paid") {
    await prisma.reservation.update({
      where: { id: payment.reservationId },
      data: { status: "completed" },
    });

    // H3 + C2: null check + LINE 推播失敗不影響主流程
    const lineUserId = payment.reservation.user.lineUserId;
    if (lineUserId) {
      try {
        await sendLineMessage(lineUserId, [
          paymentConfirmedMessage({
            displayName: payment.reservation.user.displayName,
            amount: payment.amount,
            method: method ?? "現金",
          }),
        ], tenant.lineMessagingToken);
      } catch (err) {
        console.error("[LINE] 付款確認推播失敗:", err);
      }
    }
  }

  return NextResponse.json(payment);
}
