import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";

// GET /api/superadmin/stats
export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalTenants, activeTenants, totalUsers, todayReservations, monthRevenue] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "member" } }),
      prisma.reservation.count({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
          status: { in: ["pending", "confirmed", "checked_in"] },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: "paid",
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

  return NextResponse.json({
    totalTenants,
    activeTenants,
    totalUsers,
    todayReservations,
    monthRevenue: monthRevenue._sum.amount ?? 0,
  });
}
