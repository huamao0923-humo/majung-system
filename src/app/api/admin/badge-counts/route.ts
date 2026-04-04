import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/date";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();

  const [pending, confirmedToday, unpaidToday] = await Promise.all([
    prisma.reservation.count({
      where: { status: "pending" },
    }),
    prisma.reservation.count({
      where: {
        status: "confirmed",
        date: { gte: startOfDay(today), lte: endOfDay(today) },
      },
    }),
    prisma.payment.count({
      where: {
        status: "unpaid",
        reservation: { status: { in: ["checked_in", "completed"] } },
      },
    }),
  ]);

  return NextResponse.json({ pending, confirmedToday, unpaidToday });
}
