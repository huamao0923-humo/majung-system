import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getTenant } from "@/lib/tenant";

// GET: return all closed dates for tenant (public - no auth required)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const closedDates = await prisma.closedDate.findMany({
    where: { tenantId: tenant.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(closedDates);
}

// POST: add a closed date { date: "YYYY-MM-DD", reason?: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const { date, reason } = body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日期格式錯誤，請使用 YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const closedDate = await prisma.closedDate.create({
      data: {
        tenantId: tenant.id,
        date,
        reason: reason ?? null,
      },
    });
    return NextResponse.json(closedDate, { status: 201 });
  } catch {
    // Unique constraint violation — date already exists
    return NextResponse.json({ error: "此日期已設為休息日" }, { status: 409 });
  }
}

// DELETE: remove a closed date by ?date=YYYY-MM-DD
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "缺少 date 參數" }, { status: 400 });
  }

  const existing = await prisma.closedDate.findUnique({
    where: { tenantId_date: { tenantId: tenant.id, date } },
  });

  if (!existing) {
    return NextResponse.json({ error: "找不到此休息日" }, { status: 404 });
  }

  await prisma.closedDate.delete({
    where: { tenantId_date: { tenantId: tenant.id, date } },
  });

  return NextResponse.json({ success: true });
}
