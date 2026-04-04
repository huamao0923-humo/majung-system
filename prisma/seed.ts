import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function seedTenant(slug: string, name: string) {
  let tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { slug, name, isActive: true },
    });
    console.log(`✅ 建立租戶: ${name} (${slug})`);
  }

  // ── 樓層 ──────────────────────────────────────────
  const floorCount = await prisma.floor.count({ where: { tenantId: tenant.id } });
  let floor;
  if (floorCount === 0) {
    floor = await prisma.floor.create({
      data: { tenantId: tenant.id, name: "1F 大廳", order: 0 },
    });
    console.log(`✅ 建立樓層: 1F 大廳`);
  } else {
    floor = await prisma.floor.findFirst({ where: { tenantId: tenant.id }, orderBy: { order: "asc" } });
  }

  // ── 桌位 ──────────────────────────────────────────
  const tableCount = await prisma.table.count({ where: { tenantId: tenant.id } });
  if (tableCount === 0 && floor) {
    await prisma.table.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        tenantId: tenant!.id,
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
    console.log(`✅ 建立 10 張桌位`);
  }

  // ── 時段 ──────────────────────────────────────────
  const slotCount = await prisma.timeSlot.count({ where: { tenantId: tenant.id } });
  if (slotCount === 0) {
    await prisma.timeSlot.createMany({
      data: [
        { tenantId: tenant.id, name: "早場", startTime: "09:00", endTime: "13:00", price: 300, isActive: true, order: 0 },
        { tenantId: tenant.id, name: "午場", startTime: "13:00", endTime: "17:30", price: 350, isActive: true, order: 1 },
        { tenantId: tenant.id, name: "晚場", startTime: "18:00", endTime: "23:00", price: 400, isActive: true, order: 2 },
      ],
    });
    console.log(`✅ 建立 3 個時段`);
  }

  // ── 公告 ──────────────────────────────────────────
  const announceCount = await prisma.announcement.count({ where: { tenantId: tenant.id } });
  if (announceCount === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          tenantId: tenant.id,
          title: "歡迎使用線上預約系統",
          content: "為方便管理，請提前預約桌位。若需取消請至少提前2小時通知，感謝配合！",
          isActive: true,
        },
        {
          tenantId: tenant.id,
          title: "五月份優惠活動",
          content: "5/1～5/31 早場每桌享85折優惠，歡迎揪團同樂！",
          isActive: true,
        },
        {
          tenantId: tenant.id,
          title: "設備維護通知",
          content: "本週四（5/8）上午9點至12點進行空調維護，早場暫停開放，造成不便敬請見諒。",
          isActive: false,
        },
      ],
    });
    console.log(`✅ 建立 3 則公告`);
  }

  // ── 會員 ──────────────────────────────────────────
  const userCount = await prisma.user.count({ where: { tenantId: tenant.id, role: "member" } });
  if (userCount === 0) {
    const members = await prisma.user.createManyAndReturn({
      data: [
        { tenantId: tenant.id, lineUserId: "demo_member_001", displayName: "王小明", phone: "0912-345-678", role: "member", noShowCount: 0 },
        { tenantId: tenant.id, lineUserId: "demo_member_002", displayName: "陳雅婷", phone: "0923-456-789", role: "member", noShowCount: 1 },
        { tenantId: tenant.id, lineUserId: "demo_member_003", displayName: "林志遠", phone: "0934-567-890", role: "member", noShowCount: 0 },
        { tenantId: tenant.id, lineUserId: "demo_member_004", displayName: "黃美玲", phone: "0945-678-901", role: "member", noShowCount: 3 },
        { tenantId: tenant.id, lineUserId: "demo_member_005", displayName: "張大同", phone: "0956-789-012", role: "member", noShowCount: 0 },
        { tenantId: tenant.id, lineUserId: "demo_member_006", displayName: "劉佳慧", phone: "0967-890-123", role: "member", noShowCount: 0 },
        { tenantId: tenant.id, lineUserId: "demo_member_007", displayName: "吳建國", phone: "0978-901-234", role: "member", noShowCount: 2, isBlacklisted: false },
        { tenantId: tenant.id, lineUserId: "demo_member_008", displayName: "周淑芬", phone: "0989-012-345", role: "member", noShowCount: 0 },
      ],
    });
    console.log(`✅ 建立 ${members.length} 位會員`);

    // ── 管理員 ──────────────────────────────────────
    const adminCount = await prisma.user.count({ where: { tenantId: tenant.id, role: "admin" } });
    if (adminCount === 0) {
      await prisma.user.create({
        data: { tenantId: tenant.id, lineUserId: "demo_admin_001", displayName: "店長老王", phone: "0900-000-001", role: "admin" },
      });
      console.log(`✅ 建立管理員`);
    }

    // ── 取得桌位與時段 ──────────────────────────────
    const tables = await prisma.table.findMany({ where: { tenantId: tenant.id }, orderBy: { order: "asc" } });
    const slots  = await prisma.timeSlot.findMany({ where: { tenantId: tenant.id }, orderBy: { order: "asc" } });

    if (tables.length === 0 || slots.length === 0) {
      console.log("⚠️  無桌位或時段，跳過預約種子");
      return;
    }

    const [earlySlot, noonSlot, eveningSlot] = slots;

    // 輔助：建立預約 + 付款
    async function createReservation(data: {
      userId: string;
      tableId: string;
      timeSlotId: string;
      date: Date;
      guestCount: number;
      status: string;
      payStatus: "paid" | "unpaid";
      amount: number;
      checkedInAt?: Date;
    }) {
      const r = await prisma.reservation.create({
        data: {
          tenantId: tenant!.id,
          userId: data.userId,
          tableId: data.tableId,
          timeSlotId: data.timeSlotId,
          date: data.date,
          guestCount: data.guestCount,
          status: data.status,
          checkedInAt: data.checkedInAt,
        },
      });
      await prisma.payment.create({
        data: {
          reservationId: r.id,
          amount: data.amount,
          status: data.payStatus,
          paidAt: data.payStatus === "paid" ? new Date() : null,
          method: data.payStatus === "paid" ? "現金" : null,
        },
      });
      return r;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── 今日預約 ────────────────────────────────────
    await createReservation({ userId: members[0].id, tableId: tables[0].id, timeSlotId: earlySlot.id,   date: today, guestCount: 4, status: "checked_in", payStatus: "unpaid",  amount: earlySlot.price,   checkedInAt: new Date() });
    await createReservation({ userId: members[1].id, tableId: tables[1].id, timeSlotId: earlySlot.id,   date: today, guestCount: 3, status: "confirmed",  payStatus: "unpaid",  amount: earlySlot.price });
    await createReservation({ userId: members[2].id, tableId: tables[2].id, timeSlotId: noonSlot.id,    date: today, guestCount: 4, status: "confirmed",  payStatus: "unpaid",  amount: noonSlot.price });
    await createReservation({ userId: members[3].id, tableId: tables[3].id, timeSlotId: noonSlot.id,    date: today, guestCount: 2, status: "pending",    payStatus: "unpaid",  amount: noonSlot.price });
    await createReservation({ userId: members[4].id, tableId: tables[4].id, timeSlotId: eveningSlot.id, date: today, guestCount: 4, status: "pending",    payStatus: "unpaid",  amount: eveningSlot.price });
    await createReservation({ userId: members[5].id, tableId: tables[5].id, timeSlotId: eveningSlot.id, date: today, guestCount: 3, status: "confirmed",  payStatus: "unpaid",  amount: eveningSlot.price });
    console.log(`✅ 建立今日預約 6 筆`);

    // ── 明天預約 ─────────────────────────────────────
    const tomorrow = daysFromNow(1);
    await createReservation({ userId: members[6].id, tableId: tables[0].id, timeSlotId: earlySlot.id,   date: tomorrow, guestCount: 4, status: "confirmed", payStatus: "unpaid", amount: earlySlot.price });
    await createReservation({ userId: members[7].id, tableId: tables[1].id, timeSlotId: noonSlot.id,    date: tomorrow, guestCount: 3, status: "pending",   payStatus: "unpaid", amount: noonSlot.price });
    await createReservation({ userId: members[0].id, tableId: tables[2].id, timeSlotId: eveningSlot.id, date: tomorrow, guestCount: 4, status: "confirmed", payStatus: "unpaid", amount: eveningSlot.price });

    // ── 後天預約 ─────────────────────────────────────
    const d2 = daysFromNow(2);
    await createReservation({ userId: members[1].id, tableId: tables[0].id, timeSlotId: noonSlot.id,    date: d2, guestCount: 4, status: "pending", payStatus: "unpaid", amount: noonSlot.price });
    await createReservation({ userId: members[3].id, tableId: tables[2].id, timeSlotId: eveningSlot.id, date: d2, guestCount: 2, status: "pending", payStatus: "unpaid", amount: eveningSlot.price });
    console.log(`✅ 建立未來預約 5 筆`);

    // ── 過去已完成預約（帶收入）────────────────────────
    for (let i = 1; i <= 7; i++) {
      const d = daysAgo(i);
      const memberIdx = i % members.length;
      const tableIdx  = i % tables.length;
      const slot = i % 3 === 0 ? eveningSlot : i % 3 === 1 ? earlySlot : noonSlot;
      await createReservation({
        userId: members[memberIdx].id,
        tableId: tables[tableIdx].id,
        timeSlotId: slot.id,
        date: d,
        guestCount: (i % 3) + 2,
        status: "completed",
        payStatus: "paid",
        amount: slot.price,
        checkedInAt: d,
      });
    }
    console.log(`✅ 建立過去 7 天完成預約`);

    // ── 取消紀錄 ─────────────────────────────────────
    await createReservation({ userId: members[3].id, tableId: tables[6].id, timeSlotId: earlySlot.id, date: daysAgo(2), guestCount: 4, status: "cancelled", payStatus: "unpaid", amount: earlySlot.price });
    await createReservation({ userId: members[6].id, tableId: tables[7].id, timeSlotId: noonSlot.id,  date: daysAgo(3), guestCount: 3, status: "cancelled", payStatus: "unpaid", amount: noonSlot.price });
    console.log(`✅ 建立取消預約 2 筆`);

    // ── 候補名單 ─────────────────────────────────────
    await prisma.waitlistEntry.createMany({
      data: [
        { tenantId: tenant!.id, userId: members[4].id, timeSlotId: earlySlot.id,   date: today,          guestCount: 4, notified: false },
        { tenantId: tenant!.id, userId: members[5].id, timeSlotId: noonSlot.id,    date: today,          guestCount: 3, notified: true  },
        { tenantId: tenant!.id, userId: members[7].id, timeSlotId: eveningSlot.id, date: daysFromNow(1), guestCount: 4, notified: false },
      ],
    });
    console.log(`✅ 建立候補名單 3 筆`);
  }

  return tenant;
}

async function seedSuperAdmin() {
  const username = process.env.SUPERADMIN_USERNAME ?? "superadmin";
  const password = process.env.SUPERADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.superAdmin.findUnique({ where: { username } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.superAdmin.create({ data: { username, passwordHash } });
    console.log(`✅ 建立 SuperAdmin: ${username}`);
  }
}

async function main() {
  console.log("🌱 開始植入種子資料...");
  await seedSuperAdmin();
  await seedTenant("default", "麻將館（預設）");
  console.log("✅ 種子資料植入完成！");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
