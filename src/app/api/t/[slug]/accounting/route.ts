import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";
import { startOfMonth, endOfMonth, parseISO, formatDate } from "@/lib/date";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // Expected format: YYYY-MM

  // Build date range filter based on reservation date (not paidAt)
  const dateFilter: Record<string, unknown> = {};
  if (monthParam) {
    const monthStart = parseISO(`${monthParam}-01`);
    dateFilter.reservation = {
      tenantId: tenant.id,
      date: {
        gte: startOfMonth(monthStart),
        lte: endOfMonth(monthStart),
      },
    };
  } else {
    dateFilter.reservation = { tenantId: tenant.id };
  }

  // Fetch all payments (all statuses) so we can compute summary
  const payments = await prisma.payment.findMany({
    where: dateFilter,
    include: {
      reservation: {
        include: {
          user: { select: { id: true, displayName: true, phone: true } },
          table: { select: { id: true, name: true } },
          timeSlot: { select: { id: true, name: true, order: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Summary
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const paid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const unpaid = payments.filter((p) => p.status === "unpaid").reduce((sum, p) => sum + p.amount, 0);
  const cancelled = payments.filter((p) => p.status === "cancelled").reduce((sum, p) => sum + p.amount, 0);
  const count = payments.length;
  const paidCount = payments.filter((p) => p.status === "paid").length;

  // By time slot
  const byTimeSlotMap: Record<string, { name: string; order: number; count: number; revenue: number }> = {};
  for (const p of payments) {
    if (p.status !== "paid") continue;
    const { name, order } = p.reservation.timeSlot;
    if (!byTimeSlotMap[name]) byTimeSlotMap[name] = { name, order, count: 0, revenue: 0 };
    byTimeSlotMap[name].count++;
    byTimeSlotMap[name].revenue += p.amount;
  }
  const byTimeSlot = Object.values(byTimeSlotMap)
    .sort((a, b) => a.order - b.order)
    .map(({ name, count, revenue }) => ({ name, count, revenue }));

  // By date
  const byDateMap: Record<string, { date: string; count: number; revenue: number }> = {};
  for (const p of payments) {
    if (p.status !== "paid") continue;
    const dateStr = formatDate(p.reservation.date);
    if (!byDateMap[dateStr]) byDateMap[dateStr] = { date: dateStr, count: 0, revenue: 0 };
    byDateMap[dateStr].count++;
    byDateMap[dateStr].revenue += p.amount;
  }
  const byDate = Object.values(byDateMap).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    payments,
    summary: { total, paid, unpaid, cancelled, count, paidCount },
    byTimeSlot,
    byDate,
  });
}
