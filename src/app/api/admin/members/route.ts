import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdminSession() {
  const session = await auth();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = session.user.tenantId as string | undefined;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 20;

  const where = {
    role: "member" as const,
    ...(tenantId ? { tenantId } : {}),
    ...(search ? {
      OR: [
        { displayName: { contains: search } },
        { phone: { contains: search } },
      ],
    } : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { reservations: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pageSize });
}
