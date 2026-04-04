import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;
  return NextResponse.json(tenant);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await requireAdmin(slug);
  if ("error" in result) return result.error;
  const { tenant } = result;

  const body = await req.json();
  const {
    cancelDeadlineHours,
    minAdvanceHours,
    maxAdvanceDays,
    name,
    lineChannelId,
    lineChannelSecret,
    lineMessagingToken,
    lineLiffId,
  } = body;

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      ...(name !== undefined && { name }),
      ...(cancelDeadlineHours !== undefined && { cancelDeadlineHours: parseInt(cancelDeadlineHours) }),
      ...(minAdvanceHours !== undefined && { minAdvanceHours: parseInt(minAdvanceHours) }),
      ...(maxAdvanceDays !== undefined && { maxAdvanceDays: parseInt(maxAdvanceDays) }),
      ...(lineChannelId !== undefined && { lineChannelId }),
      ...(lineChannelSecret !== undefined && { lineChannelSecret }),
      ...(lineMessagingToken !== undefined && { lineMessagingToken }),
      ...(lineLiffId !== undefined && { lineLiffId }),
    },
  });

  return NextResponse.json(updated);
}
