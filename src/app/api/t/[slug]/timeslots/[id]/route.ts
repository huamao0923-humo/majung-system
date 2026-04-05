import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const { name, startTime, endTime, price, isActive, order } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (startTime !== undefined) data.startTime = startTime;
  if (endTime !== undefined) data.endTime = endTime;
  if (price !== undefined) data.price = Number(price);
  if (isActive !== undefined) data.isActive = isActive;
  if (order !== undefined) data.order = order;

  const slot = await prisma.timeSlot.update({
    where: { id, tenantId: tenant.id },
    data,
  });

  return NextResponse.json(slot);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  await prisma.timeSlot.delete({
    where: { id, tenantId: tenant.id },
  });

  return NextResponse.json({ ok: true });
}
