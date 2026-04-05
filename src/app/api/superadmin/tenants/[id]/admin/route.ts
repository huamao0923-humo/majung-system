import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import bcrypt from "bcryptjs";

// POST: 建立或更新租戶管理員帳號
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "帳號與密碼為必填" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密碼至少需要 6 個字元" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return NextResponse.json({ error: "租戶不存在" }, { status: 404 });

  // 確認 username 未被其他租戶的管理員佔用
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.tenantId !== id) {
    return NextResponse.json({ error: "此帳號名稱已被使用" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // 找到此租戶的 admin user
  const adminUser = await prisma.user.findFirst({
    where: { tenantId: id, role: "admin" },
  });

  if (adminUser) {
    // 更新現有管理員
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { username, passwordHash },
    });
  } else {
    // 建立新管理員（無 LINE 帳號）
    await prisma.user.create({
      data: {
        tenantId: id,
        lineUserId: `admin_credentials_${Date.now()}`,
        displayName: `${tenant.name} 管理員`,
        role: "admin",
        username,
        passwordHash,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

// GET: 取得租戶管理員帳號資訊（不回傳密碼）
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;

  const adminUser = await prisma.user.findFirst({
    where: { tenantId: id, role: "admin" },
    select: { id: true, username: true, displayName: true, createdAt: true },
  });

  return NextResponse.json({ admin: adminUser });
}
