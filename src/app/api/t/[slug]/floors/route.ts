import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant, requireAdmin } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireTenant(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const floors = await prisma.floor.findMany({
    where: { tenantId: tenant.id },
    include: {
      tables: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(floors);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const { name, order } = body;

  if (!name) {
    return NextResponse.json({ error: "缺少必要欄位 (name)" }, { status: 400 });
  }

  const floor = await prisma.floor.create({
    data: {
      tenantId: tenant.id,
      name,
      order: order ?? 0,
    },
  });

  return NextResponse.json(floor, { status: 201 });
}
