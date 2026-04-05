import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenantId = session.user.tenantId as string | undefined;

  const deleted = await prisma.user.deleteMany({
    where: {
      role: "member",
      lineUserId: { startsWith: "demo_" },
      ...(tenantId ? { tenantId } : {}),
    },
  });

  return NextResponse.json({ deleted: deleted.count });
}
