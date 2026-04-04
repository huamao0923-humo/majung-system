import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant, requireAdmin } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireTenant(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const slots = await prisma.timeSlot.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(slots);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const slot = await prisma.timeSlot.create({
    data: { ...body, tenantId: tenant.id },
  });

  return NextResponse.json(slot, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const { id, ...data } = body;

  const slot = await prisma.timeSlot.update({
    where: { id, tenantId: tenant.id },
    data,
  });

  return NextResponse.json(slot);
}
