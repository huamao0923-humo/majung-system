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
  const { isBlacklisted, phone, note } = body;

  const user = await prisma.user.findFirst({ where: { id, tenantId: tenant.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(isBlacklisted !== undefined && { isBlacklisted }),
      ...(phone !== undefined && { phone }),
    },
  });

  return NextResponse.json(updated);
}
