import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/date";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "day"; // day | month
  const date = searchParams.get("date") ?? new Date().toISOString();

  const d = new Date(date);
  const start = type === "month" ? startOfMonth(d) : startOfDay(d);
  const end = type === "month" ? endOfMonth(d) : endOfDay(d);

  const payments = await prisma.payment.findMany({
    where: {
      status: "paid",
      paidAt: { gte: start, lte: end },
    },
    include: {
      reservation: {
        include: {
          user: { select: { displayName: true, phone: true } },
          table: true,
          timeSlot: true,
        },
      },
    },
    orderBy: { paidAt: "asc" },
  });

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCount = payments.length;

  // Group by timeSlot
  const bySlot: Record<string, { name: string; count: number; amount: number }> = {};
  for (const p of payments) {
    const slotName = p.reservation.timeSlot.name;
    if (!bySlot[slotName]) bySlot[slotName] = { name: slotName, count: 0, amount: 0 };
    bySlot[slotName].count++;
    bySlot[slotName].amount += p.amount;
  }

  return NextResponse.json({
    payments,
    summary: {
      totalAmount,
      totalCount,
      bySlot: Object.values(bySlot),
    },
  });
}
