import { prisma } from "@/lib/prisma";
import { formatDate, formatDateShort, startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/date";
import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import TenantReservationActions from "./actions";

export const dynamic = 'force-dynamic';

const statusMap: Record<string, { label: string; bg: string; text: string }> = {
  pending:    { label: "待確認", bg: "#FEF9C3", text: "#854D0E" },
  confirmed:  { label: "已確認", bg: "#DCFCE7", text: "#166534" },
  checked_in: { label: "已入場", bg: "#DBEAFE", text: "#1E40AF" },
  completed:  { label: "已完成", bg: "#F3F4F6", text: "#6B7280" },
  cancelled:  { label: "已取消", bg: "#FEE2E2", text: "#991B1B" },
};

type Range = "today" | "week" | "biweek" | "month";

function getDateRange(range: Range, baseDate: Date): { start: Date; end: Date; label: string } {
  const today = startOfDay(baseDate);

  if (range === "today") {
    return { start: today, end: endOfDay(today), label: "今天" };
  }

  if (range === "week") {
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: startOfDay(monday), end: endOfDay(sunday), label: "本週" };
  }

  if (range === "biweek") {
    const end = new Date(today);
    end.setDate(today.getDate() + 13);
    return { start: today, end: endOfDay(end), label: "雙週" };
  }

  return { start: startOfMonth(today), end: endOfMonth(today), label: "本月" };
}

export default async function TenantAdminReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string; status?: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return notFound();

  const sp = await searchParams;
  const range = (sp.range ?? "today") as Range;
  const statusFilter = sp.status ?? "";
  const today = new Date();

  const { start, end, label } = getDateRange(range, today);

  const where: Record<string, unknown> = {
    tenantId: tenant.id,
    date: { gte: start, lte: end },
  };
  if (statusFilter) where.status = statusFilter;

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: { select: { displayName: true, phone: true } },
      table: true,
      timeSlot: true,
      payment: true,
    },
    orderBy: [{ date: "asc" }, { timeSlot: { order: "asc" } }, { createdAt: "asc" }],
  });

  const isMultiDay = range !== "today";
  const grouped: Record<string, typeof reservations> = {};
  for (const r of reservations) {
    const key = r.date.toISOString().split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }
  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  const RANGES: { key: Range; label: string }[] = [
    { key: "today",  label: "今天" },
    { key: "week",   label: "本週" },
    { key: "biweek", label: "雙週" },
    { key: "month",  label: "本月" },
  ];

  const base = `/t/${slug}/admin/reservations`;

  function rangeHref(r: Range) {
    const p = new URLSearchParams();
    p.set("range", r);
    if (statusFilter) p.set("status", statusFilter);
    return `${base}?${p.toString()}`;
  }

  function statusHref(s: string) {
    const p = new URLSearchParams();
    p.set("range", range);
    if (s) p.set("status", s);
    return `${base}?${p.toString()}`;
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>預約管理</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
            {label} · {formatDate(start)}{range !== "today" ? ` ～ ${formatDate(end)}` : ""} · 共 {reservations.length} 筆
          </p>
        </div>
      </div>

      {/* 篩選列 */}
      <div className="rounded-2xl p-4 shadow-sm space-y-3" style={{ background: "white", border: "1px solid #D4AF3720" }}>
        <div className="flex gap-2 flex-wrap">
          {RANGES.map(({ key, label: l }) => {
            const active = range === key;
            return (
              <Link
                key={key}
                href={rangeHref(key)}
                className="px-4 py-1.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-85"
                style={
                  active
                    ? { background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }
                    : { background: "#FDF6E3", color: "rgba(139,0,0,0.7)", border: "1px solid rgba(212,175,55,0.3)" }
                }
              >
                {l}
              </Link>
            );
          })}

          <div className="w-px mx-1 self-stretch" style={{ background: "rgba(212,175,55,0.25)" }} />

          {[{ value: "", label: "全部" }, ...Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.label }))].map(
            ({ value, label: l }) => {
              const active = statusFilter === value;
              return (
                <Link
                  key={value || "all"}
                  href={statusHref(value)}
                  className="px-3 py-1.5 rounded-xl text-sm transition-opacity hover:opacity-85"
                  style={
                    active
                      ? { background: "rgba(139,0,0,0.1)", color: "#8B0000", fontWeight: 600, border: "1px solid rgba(139,0,0,0.25)" }
                      : { color: "rgba(139,0,0,0.55)", border: "1px solid transparent" }
                  }
                >
                  {l}
                </Link>
              );
            }
          )}
        </div>
      </div>

      {/* 列表 */}
      {reservations.length === 0 ? (
        <div
          className="rounded-2xl text-center py-14 text-sm"
          style={{ background: "white", border: "1px solid #D4AF3720", color: "rgba(139,0,0,0.3)" }}
        >
          此期間無預約紀錄
        </div>
      ) : isMultiDay ? (
        <div className="space-y-4">
          {groupedEntries.map(([dateKey, rows]) => {
            const dateObj = new Date(dateKey + "T00:00:00");
            const isToday = dateKey === today.toISOString().split("T")[0];
            return (
              <div key={dateKey} className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #D4AF3720" }}>
                <div
                  className="px-5 py-2.5 flex items-center gap-3"
                  style={{
                    background: isToday
                      ? "linear-gradient(135deg, #8B0000, #5C0000)"
                      : "linear-gradient(135deg, #1A0500, #0D0200)",
                    borderBottom: "1px solid #D4AF3725",
                  }}
                >
                  <span className="font-semibold text-sm" style={{ color: isToday ? "#D4AF37" : "rgba(212,175,55,0.8)" }}>
                    {formatDateShort(dateObj)}
                  </span>
                  {isToday && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37" }}>
                      今天
                    </span>
                  )}
                  <span className="text-xs ml-auto" style={{ color: "rgba(212,175,55,0.5)" }}>
                    {rows.length} 筆
                  </span>
                </div>

                <div className="px-5 py-2 flex items-center gap-4 text-xs font-semibold"
                  style={{ background: "#FAF7EE", color: "rgba(139,0,0,0.45)", borderBottom: "1px solid #D4AF3715" }}>
                  <span className="flex-1">會員</span>
                  <span className="w-16">桌位</span>
                  <span className="w-16">時段</span>
                  <span className="w-10 text-center">人數</span>
                  <span className="w-20 text-center">狀態</span>
                  <span className="w-20 text-center">繳費</span>
                  <span className="w-28">操作</span>
                </div>

                <div className="bg-white divide-y" style={{ borderColor: "#D4AF3712" }}>
                  {rows.map((r) => {
                    const s = statusMap[r.status] ?? { label: r.status, bg: "#F3F4F6", text: "#6B7280" };
                    return (
                      <div key={r.id} className="px-5 py-3 flex items-center gap-4 hover:bg-amber-50/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#1A0500" }}>{r.user.displayName}</p>
                          {r.user.phone && (
                            <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{r.user.phone}</p>
                          )}
                        </div>
                        <span className="w-16 text-sm" style={{ color: "#3D0A00" }}>{r.table.name}</span>
                        <span className="w-16 text-sm" style={{ color: "#3D0A00" }}>{r.timeSlot.name}</span>
                        <span className="w-10 text-center text-sm" style={{ color: "#3D0A00" }}>{r.guestCount}</span>
                        <span className="w-20 text-center text-xs px-2 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>
                          {s.label}
                        </span>
                        <span
                          className="w-20 text-center text-xs font-medium"
                          style={{ color: r.payment?.status === "paid" ? "#166534" : "#D97706" }}
                        >
                          {r.payment?.status === "paid" ? "已繳費" : `NT$${r.payment?.amount ?? 0}`}
                        </span>
                        <div className="w-28">
                          <TenantReservationActions reservation={{ id: r.id, status: r.status }} slug={slug} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #D4AF3720" }}>
          <div
            className="px-5 py-3 flex items-center gap-4 text-xs font-semibold uppercase"
            style={{ background: "linear-gradient(135deg, #1A0500, #0D0200)", color: "rgba(212,175,55,0.6)", borderBottom: "1px solid #D4AF3725" }}
          >
            <span className="flex-1">會員</span>
            <span className="w-20">桌位</span>
            <span className="w-20">時段</span>
            <span className="w-12 text-center">人數</span>
            <span className="w-20 text-center">狀態</span>
            <span className="w-20 text-center">繳費</span>
            <span className="w-32">操作</span>
          </div>

          <div className="bg-white divide-y" style={{ borderColor: "#D4AF3715" }}>
            {reservations.map((r) => {
              const s = statusMap[r.status] ?? { label: r.status, bg: "#F3F4F6", text: "#6B7280" };
              return (
                <div key={r.id} className="px-5 py-3 flex items-center gap-4 hover:bg-amber-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1A0500" }}>{r.user.displayName}</p>
                    {r.user.phone && (
                      <p className="text-xs" style={{ color: "rgba(139,0,0,0.45)" }}>{r.user.phone}</p>
                    )}
                  </div>
                  <span className="w-20 text-sm" style={{ color: "#3D0A00" }}>{r.table.name}</span>
                  <span className="w-20 text-sm" style={{ color: "#3D0A00" }}>{r.timeSlot.name}</span>
                  <span className="w-12 text-center text-sm" style={{ color: "#3D0A00" }}>{r.guestCount}</span>
                  <span className="w-20 text-center text-xs px-2 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>
                    {s.label}
                  </span>
                  <span
                    className="w-20 text-center text-xs font-medium"
                    style={{ color: r.payment?.status === "paid" ? "#166534" : "#D97706" }}
                  >
                    {r.payment?.status === "paid" ? "已繳費" : `NT$${r.payment?.amount ?? 0}`}
                  </span>
                  <div className="w-32">
                    <TenantReservationActions reservation={{ id: r.id, status: r.status }} slug={slug} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
