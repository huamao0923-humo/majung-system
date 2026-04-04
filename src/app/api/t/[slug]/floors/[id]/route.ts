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
  const { name, order } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (order !== undefined) data.order = order;

  const floor = await prisma.floor.update({
    where: { id, tenantId: tenant.id },
    data,
  });

  return NextResponse.json(floor);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  // Cascade delete: remove all tables under this floor first, then the floor
  await prisma.table.deleteMany({
    where: { floorId: id, tenantId: tenant.id },
  });

  await prisma.floor.delete({
    where: { id, tenantId: tenant.id },
  });

  return NextResponse.json({ ok: true });
}
