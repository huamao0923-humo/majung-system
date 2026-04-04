import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const floors = await prisma.floor.findMany({
    include: {
      tables: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(floors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "名稱不能為空" }, { status: 400 });
  }

  const count = await prisma.floor.count();

  const floor = await prisma.floor.create({
    data: {
      name: name.trim(),
      order: count,
      tenantId: session.user.tenantId ?? "default",
    },
    include: { tables: true },
  });

  return NextResponse.json(floor, { status: 201 });
}
