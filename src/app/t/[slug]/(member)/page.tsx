import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate, startOfDay, endOfDay } from "@/lib/date";
import { CalendarPlus } from "lucide-react";
import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "待確認", color: "#92400E", bg: "#FEF3C7" },
  confirmed:  { label: "已確認", color: "#065F46", bg: "#D1FAE5" },
  checked_in: { label: "已入場", color: "#1E40AF", bg: "#DBEAFE" },
  completed:  { label: "已完成", color: "#374151", bg: "#F3F4F6" },
  cancelled:  { label: "已取消", color: "#991B1B", bg: "#FEE2E2" },
};

function TileTag({ char, borderColor, textColor }: { char: string; borderColor: string; textColor: string }) {
  return (
    <div
      style={{
        width: "22px",
        height: "30px",
        borderRadius: "4px",
        border: `1.5px solid ${borderColor}`,
        background: "linear-gradient(150deg, #ffffff 0%, #f5eed8 100%)",
        color: textColor,
        fontFamily: "'Noto Serif TC', serif",
        fontWeight: "700",
        fontSize: "12px",
        boxShadow: "1px 2px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: "1",
      }}
    >
      {char}
    </div>
  );
}

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return notFound();

  const session = await auth();
  if (!session) redirect(`/t/${slug}/login`);
  if (session.user.role === "admin" || session.user.role === "superadmin") {
    redirect(`/t/${slug}/admin`);
  }

  const today = new Date();

  const [announcements, todayReservations, timeSlots] = await Promise.all([
    prisma.announcement.findMany({
      where: { isActive: true, tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.reservation.findMany({
      where: {
        userId: session.user.id,
        tenantId: tenant.id,
        date: { gte: startOfDay(today), lte: endOfDay(today) },
        status: { in: ["pending", "confirmed", "checked_in"] },
      },
      include: { table: true, timeSlot: true },
    }),
    prisma.timeSlot.findMany({
      where: { isActive: true, tenantId: tenant.id },
      orderBy: { order: "asc" },
    }),
  ]);

  const suits = ["萬", "筒", "條"];

  return (
    <div className="max-w-lg mx-auto min-h-screen" style={{ background: "#FDF6E3" }}>
      {/* Header */}
      <div
        className="relative px-5 pt-10 pb-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #5C0000 0%, #8B0000 50%, #6B0000 100%)" }}
      >
        {/* 裝飾麻將牌（右上角，純裝飾） */}
        <div
          className="absolute top-3 right-3 flex gap-1 pointer-events-none select-none"
          style={{ opacity: 0.15 }}
        >
          {[
            { char: "中", color: "#8B0000" },
            { char: "發", color: "#1B4D1B" },
            { char: "白", color: "#444" },
          ].map(({ char, color }) => (
            <span
              key={char}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "32px",
                borderRadius: "4px",
                border: "1.5px solid rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.9)",
                color,
                fontFamily: "serif",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* 金色頂線 */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }}
        />
        {/* 金色底線 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, #D4AF3780, transparent)" }}
        />

        <p className="text-sm mb-1 tracking-wide" style={{ color: "#D4AF3799" }}>{formatDate(today)}</p>
        <h1 className="text-2xl font-bold tracking-widest" style={{ color: "#D4AF37" }}>歡 迎 回 來</h1>
        <p className="text-sm mt-1" style={{ color: "#F5DEB3CC" }}>{session.user.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(212,175,55,0.5)" }}>{tenant.name}</p>
      </div>

      <div className="px-4 pt-5 space-y-4 pb-24">
        {/* 今日預約 */}
        {todayReservations.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "white", border: "1px solid #D4AF3730", boxShadow: "0 2px 16px #8B000010" }}
          >
            <div
              className="px-5 py-3 flex items-center gap-2.5"
              style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", borderBottom: "1px solid #D4AF3730" }}
            >
              <TileTag char="萬" borderColor="rgba(255,255,255,0.5)" textColor="#8B0000" />
              <span className="text-sm font-semibold tracking-wide" style={{ color: "#D4AF37" }}>今日預約</span>
            </div>
            <div className="divide-y" style={{ borderColor: "#D4AF3720" }}>
              {todayReservations.map((r) => {
                const s = statusMap[r.status] ?? statusMap.pending;
                return (
                  <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#1A0A00" }}>
                        {r.table.name} · {r.timeSlot.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B4C2A" }}>
                        {r.timeSlot.startTime} ~ {r.timeSlot.endTime} · {r.guestCount} 人
                      </p>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 快速預約卡 */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "white", border: "1px solid #D4AF3730", boxShadow: "0 2px 16px #8B000010" }}
        >
          <div className="px-5 py-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid #D4AF3720" }}>
            <TileTag char="中" borderColor="#8B0000" textColor="#8B0000" />
            <span className="text-sm font-semibold" style={{ color: "#1A0A00" }}>今日開放時段</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot, i) => (
                <div
                  key={slot.id}
                  className="rounded-xl p-3 text-center relative overflow-hidden"
                  style={{ background: "#FDF6E3", border: "1px solid rgba(212,175,55,0.3)" }}
                >
                  <span
                    className="absolute top-0.5 right-1 text-2xl font-bold pointer-events-none select-none"
                    style={{ color: "rgba(212,175,55,0.12)", fontFamily: "serif", lineHeight: 1 }}
                  >
                    {suits[i] ?? ""}
                  </span>
                  <p className="font-semibold text-sm relative z-10" style={{ color: "#8B0000" }}>{slot.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.45)" }}>{slot.startTime}</p>
                  <p className="text-xs" style={{ color: "rgba(139,0,0,0.45)" }}>{slot.endTime}</p>
                  <p className="text-xs font-bold mt-1 relative z-10" style={{ color: "#D4AF37" }}>NT${slot.price}</p>
                </div>
              ))}
            </div>

            <Link
              href={`/t/${slug}/reserve`}
              className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2 transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #8B0000, #6B0000)",
                color: "#D4AF37",
                border: "1px solid #D4AF3740",
                display: "flex",
              }}
            >
              <CalendarPlus className="w-4 h-4" />
              立即預約桌位
            </Link>
          </div>
        </div>

        {/* 公告欄 */}
        {announcements.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "white", border: "1px solid #D4AF3730", boxShadow: "0 2px 16px #8B000010" }}
          >
            <div className="px-5 py-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid #D4AF3720" }}>
              <TileTag char="發" borderColor="#1B4D1B" textColor="#1B4D1B" />
              <span className="text-sm font-semibold" style={{ color: "#1A0A00" }}>最新公告</span>
            </div>
            <div className="p-4 space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="pl-3" style={{ borderLeft: "3px solid #D4AF37" }}>
                  <p className="font-semibold text-sm" style={{ color: "#1A0A00" }}>{a.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6B4C2A" }}>{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
