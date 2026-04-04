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
  const { name, capacity, isActive, posX, posY, tableWidth, tableHeight, order } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (capacity !== undefined) data.capacity = capacity;
  if (isActive !== undefined) data.isActive = isActive;
  if (posX !== undefined) data.posX = posX;
  if (posY !== undefined) data.posY = posY;
  if (tableWidth !== undefined) data.tableWidth = tableWidth;
  if (tableHeight !== undefined) data.tableHeight = tableHeight;
  if (order !== undefined) data.order = order;

  const table = await prisma.table.update({
    where: { id, tenantId: tenant.id },
    data,
  });

  return NextResponse.json(table);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  await prisma.table.delete({
    where: { id, tenantId: tenant.id },
  });

  return NextResponse.json({ ok: true });
}
