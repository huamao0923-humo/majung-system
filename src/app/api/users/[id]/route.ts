import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isBlacklisted } = body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "會員不存在" }, { status: 404 });
  }

  // Ensure admin cannot blacklist themselves
  if (id === session.user.id) {
    return NextResponse.json({ error: "不能對自己操作" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isBlacklisted: Boolean(isBlacklisted) },
    select: { id: true, isBlacklisted: true },
  });

  return NextResponse.json(updated);
}
