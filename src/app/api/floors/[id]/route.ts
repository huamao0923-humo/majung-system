import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const floor = await prisma.floor.findUnique({
    where: { id },
    include: { tables: true },
  });

  if (!floor) {
    return NextResponse.json({ error: "空間不存在" }, { status: 404 });
  }

  if (floor.tables.length > 0) {
    return NextResponse.json(
      { error: "請先移除此空間所有桌位再刪除" },
      { status: 400 }
    );
  }

  await prisma.floor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

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

  const floor = await prisma.floor.update({
    where: { id },
    data: { name: body.name },
    include: { tables: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(floor);
}
