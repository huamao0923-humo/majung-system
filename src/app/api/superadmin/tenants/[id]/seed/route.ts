import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";

const TABLE_POSITIONS = [
  { posX: 6,  posY: 6  },
  { posX: 39, posY: 6  },
  { posX: 72, posY: 6  },
  { posX: 6,  posY: 30 },
  { posX: 39, posY: 30 },
  { posX: 72, posY: 30 },
  { posX: 6,  posY: 54 },
  { posX: 39, posY: 54 },
  { posX: 72, posY: 54 },
  { posX: 39, posY: 76 },
];

// POST /api/superadmin/tenants/[id]/seed
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    return NextResponse.json({ error: "租戶不存在" }, { status: 404 });
  }

  const results: string[] = [];

  // 建立預設樓層
  const floorCount = await prisma.floor.count({ where: { tenantId: id } });
  let floor;
  if (floorCount === 0) {
    floor = await prisma.floor.create({
      data: { tenantId: id, name: "1F", order: 0 },
    });
    results.push("建立 1F 樓層");
  } else {
    floor = await prisma.floor.findFirst({
      where: { tenantId: id },
      orderBy: { order: "asc" },
    });
    results.push("樓層已存在，略過");
  }

  // 建立桌位
  const tableCount = await prisma.table.count({ where: { tenantId: id } });
  if (tableCount === 0 && floor) {
    await prisma.table.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        tenantId: id,
        floorId: floor!.id,
        name: `桌 ${i + 1}`,
        capacity: 4,
        isActive: true,
        order: i,
        posX: TABLE_POSITIONS[i].posX,
        posY: TABLE_POSITIONS[i].posY,
        tableWidth: 22,
        tableHeight: 14,
      })),
    });
    results.push("建立 10 張桌位");
  } else {
    results.push("桌位已存在，略過");
  }

  // 建立時段
  const slotCount = await prisma.timeSlot.count({ where: { tenantId: id } });
  if (slotCount === 0) {
    await prisma.timeSlot.createMany({
      data: [
        { tenantId: id, name: "早場", startTime: "09:00", endTime: "13:00", price: 300, isActive: true, order: 0 },
        { tenantId: id, name: "午場", startTime: "13:00", endTime: "17:30", price: 350, isActive: true, order: 1 },
        { tenantId: id, name: "晚場", startTime: "18:00", endTime: "23:00", price: 400, isActive: true, order: 2 },
      ],
    });
    results.push("建立 3 個時段");
  } else {
    results.push("時段已存在，略過");
  }

  // 建立公告
  const announceCount = await prisma.announcement.count({ where: { tenantId: id } });
  if (announceCount === 0) {
    await prisma.announcement.create({
      data: {
        tenantId: id,
        title: "歡迎使用線上預約系統",
        content: "為方便管理，請提前預約桌位。若需取消請至少提前2小時通知，感謝配合！",
        isActive: true,
      },
    });
    results.push("建立歡迎公告");
  } else {
    results.push("公告已存在，略過");
  }

  return NextResponse.json({ success: true, results });
}
