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

async function seedTenant(
  slug: string,
  name: string,
  options: {
    prefix?: string;
    floorName?: string;
    slots?: { name: string; startTime: string; endTime: string; price: number }[];
    announcements?: { title: string; content: string; isActive: boolean }[];
    members?: { displayName: string; phone: string; noShowCount: number; isBlacklisted?: boolean }[];
    todayReservationCount?: number;
    waitlistCount?: number;
  } = {}
) {
  const prefix = options.prefix ?? slug;
  const floorName = options.floorName ?? "1F 大廳";

  let tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { slug, name, isActive: true },
    });
    console.log(`✅ 建立租戶: ${name} (${slug})`);
  } else {
    console.log(`⏭  租戶已存在: ${name} (${slug})`);
  }

  // ── 樓層 ──────────────────────────────────────────
  const floorCount = await prisma.floor.count({ where: { tenantId: tenant.id } });
  let floor;
  if (floorCount === 0) {
    floor = await prisma.floor.create({
      data: { tenantId: tenant.id, name: floorName, order: 0 },
    });
    console.log(`✅ [${slug}] 建立樓層: ${floorName}`);
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
    console.log(`✅ [${slug}] 建立 10 張桌位`);
  }

  // ── 時段 ──────────────────────────────────────────
  const slotCount = await prisma.timeSlot.count({ where: { tenantId: tenant.id } });
  const defaultSlots = options.slots ?? [
    { name: "早場", startTime: "09:00", endTime: "13:00", price: 300 },
    { name: "午場", startTime: "13:00", endTime: "17:30", price: 350 },
    { name: "晚場", startTime: "18:00", endTime: "23:00", price: 400 },
  ];
  if (slotCount === 0) {
    await prisma.timeSlot.createMany({
      data: defaultSlots.map((s, i) => ({ tenantId: tenant!.id, ...s, isActive: true, order: i })),
    });
    console.log(`✅ [${slug}] 建立 ${defaultSlots.length} 個時段`);
  }

  // ── 公告 ──────────────────────────────────────────
  const announceCount = await prisma.announcement.count({ where: { tenantId: tenant.id } });
  const defaultAnnouncements = options.announcements ?? [
    { title: "歡迎使用線上預約系統", content: "為方便管理，請提前預約桌位。若需取消請至少提前2小時通知，感謝配合！", isActive: true },
    { title: "五月份優惠活動", content: "5/1～5/31 早場每桌享85折優惠，歡迎揪團同樂！", isActive: true },
    { title: "設備維護通知", content: "本週四上午9點至12點進行空調維護，早場暫停開放，造成不便敬請見諒。", isActive: false },
  ];
  if (announceCount === 0) {
    await prisma.announcement.createMany({
      data: defaultAnnouncements.map((a) => ({ tenantId: tenant!.id, ...a })),
    });
    console.log(`✅ [${slug}] 建立 ${defaultAnnouncements.length} 則公告`);
  }

  // ── 會員 ──────────────────────────────────────────
  const userCount = await prisma.user.count({ where: { tenantId: tenant.id, role: "member" } });
  if (userCount === 0) {
    const defaultMembers = options.members ?? [
      { displayName: "王小明", phone: "0912-345-678", noShowCount: 0 },
      { displayName: "陳雅婷", phone: "0923-456-789", noShowCount: 1 },
      { displayName: "林志遠", phone: "0934-567-890", noShowCount: 0 },
      { displayName: "黃美玲", phone: "0945-678-901", noShowCount: 3 },
      { displayName: "張大同", phone: "0956-789-012", noShowCount: 0 },
      { displayName: "劉佳慧", phone: "0967-890-123", noShowCount: 0 },
      { displayName: "吳建國", phone: "0978-901-234", noShowCount: 2 },
      { displayName: "周淑芬", phone: "0989-012-345", noShowCount: 0 },
    ];

    const members = await prisma.user.createManyAndReturn({
      data: defaultMembers.map((m, i) => ({
        tenantId: tenant!.id,
        lineUserId: `${prefix}_member_${String(i + 1).padStart(3, "0")}`,
        displayName: m.displayName,
        phone: m.phone,
        role: "member",
        noShowCount: m.noShowCount,
        isBlacklisted: m.isBlacklisted ?? false,
      })),
    });
    console.log(`✅ [${slug}] 建立 ${members.length} 位會員`);

    const adminUsername = slug === "default" ? "admin" : `${slug}-admin`;
    const adminPassword = slug === "default" ? "admin1234" : `${slug}1234`;
    const existingAdmin = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: "admin" },
    });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          lineUserId: `${prefix}_admin_001`,
          displayName: "店長",
          phone: "0900-000-001",
          role: "admin",
          username: adminUsername,
          passwordHash,
        },
      });
      console.log(`✅ [${slug}] 建立管理員 (${adminUsername} / ${adminPassword})`);
    } else if (!existingAdmin.username) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { username: adminUsername, passwordHash },
      });
      console.log(`✅ [${slug}] 補充管理員帳密 (${adminUsername} / ${adminPassword})`);
    } else {
      console.log(`⏭  [${slug}] 管理員已存在: ${existingAdmin.username}`);
    }

    // ── 取得桌位與時段 ──────────────────────────────
    const tables = await prisma.table.findMany({ where: { tenantId: tenant.id }, orderBy: { order: "asc" } });
    const slots  = await prisma.timeSlot.findMany({ where: { tenantId: tenant.id }, orderBy: { order: "asc" } });

    if (tables.length === 0 || slots.length === 0) {
      console.log(`⚠️  [${slug}] 無桌位或時段，跳過預約種子`);
      return tenant;
    }

    const [earlySlot, noonSlot, eveningSlot] = slots;

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
      const existing = await prisma.reservation.findFirst({
        where: { tenantId: tenant!.id, tableId: data.tableId, timeSlotId: data.timeSlotId, date: data.date },
      });
      if (existing) return existing;

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

    const todayCount = options.todayReservationCount ?? 6;

    // ── 今日預約 ────────────────────────────────────
    const todayStatuses = [
      { status: "checked_in", payStatus: "unpaid" as const, checkedInAt: new Date() },
      { status: "confirmed",  payStatus: "unpaid" as const },
      { status: "confirmed",  payStatus: "unpaid" as const },
      { status: "pending",    payStatus: "unpaid" as const },
      { status: "pending",    payStatus: "unpaid" as const },
      { status: "confirmed",  payStatus: "unpaid" as const },
      { status: "checked_in", payStatus: "unpaid" as const, checkedInAt: new Date() },
      { status: "pending",    payStatus: "unpaid" as const },
      { status: "confirmed",  payStatus: "unpaid" as const },
      { status: "pending",    payStatus: "unpaid" as const },
    ];
    const todaySlots = [earlySlot, earlySlot, noonSlot, noonSlot, eveningSlot, eveningSlot, earlySlot, noonSlot, eveningSlot, noonSlot];

    for (let i = 0; i < todayCount; i++) {
      const s = todayStatuses[i % todayStatuses.length];
      const slot = todaySlots[i % todaySlots.length];
      await createReservation({
        userId: members[i % members.length].id,
        tableId: tables[i].id,
        timeSlotId: slot.id,
        date: today,
        guestCount: (i % 3) + 2,
        status: s.status,
        payStatus: s.payStatus,
        amount: slot.price,
        checkedInAt: s.checkedInAt,
      });
    }
    console.log(`✅ [${slug}] 建立今日預約 ${todayCount} 筆`);

    // ── 未來預約 ─────────────────────────────────────
    const tomorrow = daysFromNow(1);
    await createReservation({ userId: members[0].id, tableId: tables[0].id, timeSlotId: earlySlot.id,   date: tomorrow, guestCount: 4, status: "confirmed", payStatus: "unpaid", amount: earlySlot.price });
    await createReservation({ userId: members[1].id, tableId: tables[1].id, timeSlotId: noonSlot.id,    date: tomorrow, guestCount: 3, status: "pending",   payStatus: "unpaid", amount: noonSlot.price });
    await createReservation({ userId: members[2 % members.length].id, tableId: tables[2].id, timeSlotId: eveningSlot.id, date: tomorrow, guestCount: 4, status: "confirmed", payStatus: "unpaid", amount: eveningSlot.price });
    const d2 = daysFromNow(2);
    await createReservation({ userId: members[3 % members.length].id, tableId: tables[0].id, timeSlotId: noonSlot.id,    date: d2, guestCount: 4, status: "pending", payStatus: "unpaid", amount: noonSlot.price });
    await createReservation({ userId: members[4 % members.length].id, tableId: tables[2].id, timeSlotId: eveningSlot.id, date: d2, guestCount: 2, status: "pending", payStatus: "unpaid", amount: eveningSlot.price });
    console.log(`✅ [${slug}] 建立未來預約 5 筆`);

    // ── 過去已完成預約 ────────────────────────────────
    for (let i = 1; i <= 7; i++) {
      const d = daysAgo(i);
      const slot = i % 3 === 0 ? eveningSlot : i % 3 === 1 ? earlySlot : noonSlot;
      await createReservation({
        userId: members[i % members.length].id,
        tableId: tables[i % tables.length].id,
        timeSlotId: slot.id,
        date: d,
        guestCount: (i % 3) + 2,
        status: "completed",
        payStatus: "paid",
        amount: slot.price,
        checkedInAt: d,
      });
    }
    console.log(`✅ [${slug}] 建立過去 7 天完成預約`);

    // ── 取消紀錄 ─────────────────────────────────────
    await createReservation({ userId: members[3 % members.length].id, tableId: tables[6].id, timeSlotId: earlySlot.id, date: daysAgo(2), guestCount: 4, status: "cancelled", payStatus: "unpaid", amount: earlySlot.price });
    await createReservation({ userId: members[(members.length > 6 ? 6 : 0)].id, tableId: tables[7].id, timeSlotId: noonSlot.id, date: daysAgo(3), guestCount: 3, status: "cancelled", payStatus: "unpaid", amount: noonSlot.price });
    console.log(`✅ [${slug}] 建立取消預約 2 筆`);

    // ── 候補名單 ─────────────────────────────────────
    const waitlistCount = options.waitlistCount ?? 3;
    if (waitlistCount > 0) {
      const waitlistData = [
        { userId: members[4 % members.length].id, timeSlotId: earlySlot.id,   date: today,          guestCount: 4, notified: false },
        { userId: members[5 % members.length].id, timeSlotId: noonSlot.id,    date: today,          guestCount: 3, notified: true  },
        { userId: members[0].id,                  timeSlotId: eveningSlot.id, date: daysFromNow(1), guestCount: 4, notified: false },
        { userId: members[1].id,                  timeSlotId: earlySlot.id,   date: today,          guestCount: 2, notified: false },
        { userId: members[2 % members.length].id, timeSlotId: noonSlot.id,    date: daysFromNow(1), guestCount: 3, notified: false },
      ];
      await prisma.waitlistEntry.createMany({
        data: waitlistData.slice(0, waitlistCount).map((w) => ({ tenantId: tenant!.id, ...w })),
      });
      console.log(`✅ [${slug}] 建立候補名單 ${waitlistCount} 筆`);
    }
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
  } else {
    console.log(`⏭  SuperAdmin 已存在: ${username}`);
  }
}

async function main() {
  console.log("🌱 開始植入種子資料...");

  await seedSuperAdmin();

  // ── 租戶 1：麻將館（預設）── 標準情境
  await seedTenant("default", "麻將館（預設）", {
    prefix: "demo",
    todayReservationCount: 6,
    waitlistCount: 3,
  });

  // ── 租戶 2：東風麻將館 ── 忙碌型，管理壓力大
  await seedTenant("east-wind", "東風麻將館", {
    prefix: "east",
    floorName: "1F 東廳",
    slots: [
      { name: "晨場", startTime: "08:00", endTime: "12:00", price: 280 },
      { name: "午場", startTime: "12:00", endTime: "17:00", price: 320 },
      { name: "夜場", startTime: "17:30", endTime: "23:30", price: 380 },
    ],
    announcements: [
      { title: "本日客滿通知", content: "今日各時段已全數預約，如需訂位請登記候補，謝謝！", isActive: true },
      { title: "常客優惠方案", content: "本月累計到場10次以上，下個月享全場8折優惠，歡迎老顧客多加利用。", isActive: true },
      { title: "禁止攜帶外食", content: "本館謝絕自帶外食，如需飲食請洽服務人員，感謝配合。", isActive: true },
    ],
    members: [
      { displayName: "趙一鳴", phone: "0911-111-001", noShowCount: 0 },
      { displayName: "錢二妹", phone: "0922-222-002", noShowCount: 2 },
      { displayName: "孫三郎", phone: "0933-333-003", noShowCount: 5 },   // 高爽約
      { displayName: "李四海", phone: "0944-444-004", noShowCount: 4 },   // 高爽約
      { displayName: "周五福", phone: "0955-555-005", noShowCount: 0, isBlacklisted: true }, // 黑名單
      { displayName: "吳六順", phone: "0966-666-006", noShowCount: 1 },
      { displayName: "鄭七巧", phone: "0977-777-007", noShowCount: 0 },
      { displayName: "王八達", phone: "0988-888-008", noShowCount: 3 },
    ],
    todayReservationCount: 10, // 全滿
    waitlistCount: 5,
  });

  // ── 租戶 3：西風麻將館 ── 輕量型，剛開業
  await seedTenant("west-wind", "西風麻將館", {
    prefix: "west",
    floorName: "1F 大廳",
    slots: [
      { name: "上午場", startTime: "10:00", endTime: "14:00", price: 350 },
      { name: "下午場", startTime: "14:00", endTime: "18:00", price: 400 },
      { name: "晚間場", startTime: "19:00", endTime: "23:00", price: 450 },
    ],
    announcements: [
      { title: "新館開幕優惠", content: "西風麻將館盛大開幕！開幕期間全面8折，歡迎新舊朋友光臨！", isActive: true },
      { title: "預約規則說明", content: "本館採全預約制，請至少提前1小時預約，如需取消請提前2小時告知。", isActive: true },
      { title: "停車資訊", content: "本館地下一樓提供免費停車，預約入場後請告知服務人員取停車票。", isActive: false },
    ],
    members: [
      { displayName: "蔣小東", phone: "0911-001-001", noShowCount: 0 },
      { displayName: "沈小西", phone: "0922-002-002", noShowCount: 0 },
      { displayName: "韓小南", phone: "0933-003-003", noShowCount: 1 },
      { displayName: "楊小北", phone: "0944-004-004", noShowCount: 0 },
      { displayName: "朱小春", phone: "0955-005-005", noShowCount: 0 },
      { displayName: "秦小夏", phone: "0966-006-006", noShowCount: 0 },
    ],
    todayReservationCount: 3, // 清淡
    waitlistCount: 0,
  });

  console.log("\n✅ 所有種子資料植入完成！");
  console.log("\n📋 租戶存取清單：");
  console.log("  麻將館（預設）: /t/default/login");
  console.log("  東風麻將館:     /t/east-wind/login");
  console.log("  西風麻將館:     /t/west-wind/login");
  console.log("  超級後台:       /superadmin  (superadmin / changeme123)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
