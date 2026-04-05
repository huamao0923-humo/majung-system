import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Build last 6 months array (oldest first)
  const months: { year: number; month: number; label: string; gte: Date; lt: Date }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${d.getMonth() + 1}月`,
      gte: d,
      lt: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    });
  }

  const counts = await Promise.all(
    months.map((m) =>
      prisma.reservation.count({
        where: {
          tenantId: id,
          date: { gte: m.gte, lt: m.lt },
        },
      })
    )
  );

  const data = months.map((m, i) => ({ label: m.label, count: counts[i] }));
  return NextResponse.json(data);
}
