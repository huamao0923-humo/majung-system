import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, startOfDay, endOfDay } from "@/lib/date";
import { Users, CalendarCheck, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await auth();
  const today = new Date();

  const [todayReservations, pendingCount, todayRevenue, totalMembers, confirmedNotCheckin, unpaidCount] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        date: { gte: startOfDay(today), lte: endOfDay(today) },
        status: { in: ["pending", "confirmed", "checked_in"] },
      },
      include: { user: { select: { displayName: true, pictureUrl: true } }, table: true, timeSlot: true },
      orderBy: { timeSlot: { order: "asc" } },
    }),
    prisma.reservation.count({ where: { status: "pending" } }),
    prisma.payment.aggregate({
      where: { status: "paid", paidAt: { gte: startOfDay(today), lte: endOfDay(today) } },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { role: "member" } }),
    prisma.reservation.count({
      where: {
        status: "confirmed",
        date: { gte: startOfDay(today), lte: endOfDay(today) },
      },
    }),
    prisma.payment.count({
      where: {
        status: "unpaid",
        reservation: { status: { in: ["checked_in", "completed"] } },
      },
    }),
  ]);

  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    pending:    { label: "待確認", bg: "#FEF9C3", text: "#854D0E" },
    confirmed:  { label: "已確認", bg: "#DCFCE7", text: "#166534" },
    checked_in: { label: "已入場", bg: "#DBEAFE", text: "#1E40AF" },
  };

  const stats = [
    { label: "今日預約", value: todayReservations.length, icon: CalendarCheck, gold: false },
    { label: "待確認",   value: pendingCount,             icon: Clock,         gold: false },
    { label: "今日收入", value: `NT$${todayRevenue._sum.amount ?? 0}`, icon: DollarSign, gold: true },
    { label: "總會員數", value: totalMembers,             icon: Users,         gold: false },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: "#1A0500" }}>儀表板</h1>
          <p className="text-sm mt-1" style={{ color: "#8B000080" }}>{formatDate(today)}</p>
        </div>
        {/* 裝飾牌組 */}
        <div className="flex gap-1 opacity-20 select-none">
          {["中", "發", "白"].map((c, i) => (
            <div
              key={c}
              className="w-6 h-8 rounded-sm flex items-center justify-center font-bold text-xs"
              style={{
                background: "linear-gradient(150deg, #fff, #f0ead8)",
                border: "1.5px solid #8B0000",
                color: i === 0 ? "#8B0000" : i === 1 ? "#1B4D1B" : "#333",
                boxShadow: "1px 2px 3px rgba(0,0,0,0.2)",
                fontFamily: "serif",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, gold }) => (
          <div
            key={label}
            className="rounded-2xl p-5 shadow-sm"
            style={{
              background: gold ? "linear-gradient(135deg, #8B0000, #5C0000)" : "white",
              border: gold ? "none" : "1px solid #D4AF3720",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: gold ? "rgba(212,175,55,0.15)" : "#FDF6E3" }}
            >
              <Icon className="w-5 h-5" style={{ color: gold ? "#D4AF37" : "#8B0000" }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: gold ? "#D4AF37" : "#1A0500" }}>{value}</p>
            <p className="text-sm mt-1" style={{ color: gold ? "rgba(212,175,55,0.6)" : "rgba(139,0,0,0.5)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* 今日必做 */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #D4AF3720" }}>
        <div
          className="px-5 py-3 flex items-center gap-2.5"
          style={{ background: "linear-gradient(135deg, #1A0500, #0D0200)", borderBottom: "1px solid #D4AF3725" }}
        >
          <div
            className="w-5 h-7 rounded-sm flex items-center justify-center font-bold text-xs flex-shrink-0"
            style={{
              background: "linear-gradient(150deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))",
              border: "1px solid rgba(212,175,55,0.4)",
              color: "#D4AF37",
              fontFamily: "serif",
            }}
          >
            中
          </div>
          <h2 className="font-semibold tracking-wide" style={{ color: "#D4AF37" }}>今日必做</h2>
        </div>

        {pendingCount === 0 && confirmedNotCheckin === 0 && unpaidCount === 0 ? (
          <div
            className="bg-white px-5 py-6 text-center"
          >
            <p className="text-sm font-semibold" style={{ color: "#D4AF37" }}>
              今日一切順利，繼續胡牌！
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(139,0,0,0.4)" }}>
              所有待辦事項已處理完畢
            </p>
          </div>
        ) : (
          <div className="bg-white divide-y" style={{ borderColor: "#D4AF3715" }}>
            {pendingCount > 0 && (
              <Link
                href="/admin/reservations?range=today&status=pending"
                className="px-5 py-4 flex items-center gap-4 transition-colors hover:bg-amber-50/40"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#FEF9C3" }}
                >
                  <Clock className="w-4 h-4" style={{ color: "#854D0E" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#1A0500" }}>
                    {pendingCount} 張牌等你摸
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
                    待確認預約 → 點擊前往處理
                  </p>
                </div>
                <span className="text-xs" style={{ color: "rgba(139,0,0,0.3)" }}>→</span>
              </Link>
            )}
            {confirmedNotCheckin > 0 && (
              <Link
                href="/admin/checkin"
                className="px-5 py-4 flex items-center gap-4 transition-colors hover:bg-amber-50/40"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#DBEAFE" }}
                >
                  <CalendarCheck className="w-4 h-4" style={{ color: "#1E40AF" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#1A0500" }}>
                    {confirmedNotCheckin} 組待入場
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
                    今日已確認尚未 check-in → 點擊確認入場
                  </p>
                </div>
                <span className="text-xs" style={{ color: "rgba(139,0,0,0.3)" }}>→</span>
              </Link>
            )}
            {unpaidCount > 0 && (
              <Link
                href="/admin/payment"
                className="px-5 py-4 flex items-center gap-4 transition-colors hover:bg-amber-50/40"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#DCFCE7" }}
                >
                  <DollarSign className="w-4 h-4" style={{ color: "#166534" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#1A0500" }}>
                    {unpaidCount} 人還沒繳費
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
                    待收款記錄 → 點擊前往繳費管理
                  </p>
                </div>
                <span className="text-xs" style={{ color: "rgba(139,0,0,0.3)" }}>→</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Today's reservations */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #D4AF3720" }}>
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #1A0500, #0D0200)", borderBottom: "1px solid #D4AF3725" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-7 rounded-sm flex items-center justify-center font-bold text-xs flex-shrink-0"
              style={{
                background: "linear-gradient(150deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))",
                border: "1px solid rgba(212,175,55,0.4)",
                color: "#D4AF37",
                fontFamily: "serif",
              }}
            >
              萬
            </div>
            <h2 className="font-semibold tracking-wide" style={{ color: "#D4AF37" }}>今日預約清單</h2>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}
          >
            共 {todayReservations.length} 筆
          </span>
        </div>
        {todayReservations.length === 0 ? (
          <div className="text-center py-12 text-sm bg-white" style={{ color: "rgba(139,0,0,0.3)" }}>
            今日尚無預約
          </div>
        ) : (
          <div className="bg-white divide-y" style={{ borderColor: "#D4AF3715" }}>
            {todayReservations.map((r) => {
              const s = statusMap[r.status] ?? { label: r.status, bg: "#F3F4F6", text: "#6B7280" };
              return (
                <div
                  key={r.id}
                  className="px-5 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-amber-50/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(139,0,0,0.12), rgba(212,175,55,0.15))", color: "#8B0000" }}
                    >
                      {r.user.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: "#1A0500" }}>{r.user.displayName}</p>
                      <p className="text-xs" style={{ color: "rgba(139,0,0,0.5)" }}>
                        {r.table.name} · {r.timeSlot.name} · {r.guestCount}人
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                    style={{ background: s.bg, color: s.text }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
