import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ReservationFilters from "./reservation-filters";

export const dynamic = 'force-dynamic';

const statusLabel: Record<string, string> = {
  pending: "待確認",
  confirmed: "已確認",
  checked_in: "已報到",
  cancelled: "已取消",
  no_show: "未到場",
};

const statusStyle: Record<string, React.CSSProperties> = {
  pending: { background: "#FEF9C3", color: "#854D0E" },
  confirmed: { background: "#DCFCE7", color: "#166534" },
  checked_in: { background: "#DBEAFE", color: "#1E40AF" },
  cancelled: { background: "#FEE2E2", color: "#991B1B" },
  no_show: { background: "#F3F4F6", color: "#6B7280" },
};

function getDateRange(dateRange: string | undefined): { gte?: Date; lte?: Date } {
  const now = new Date();
  if (dateRange === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { gte: start, lte: new Date(start.getTime() + 86400000 - 1) };
  }
  if (dateRange === "week") {
    const day = now.getDay();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    return { gte: start };
  }
  if (!dateRange || dateRange === "month") {
    return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  }
  return {};
}

export default async function SuperAdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateRange?: string; tenantId?: string; status?: string }>;
}) {
  const { error } = await requireSuperAdmin();
  if (error) redirect("/superadmin/login");

  const { dateRange, tenantId, status } = await searchParams;

  const dateFilter = getDateRange(dateRange);
  const where: Parameters<typeof prisma.reservation.findMany>[0]["where"] = {};
  if (Object.keys(dateFilter).length > 0) where.date = dateFilter;
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;

  const [reservations, tenants, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100,
      include: {
        tenant: { select: { name: true, slug: true } },
        user: { select: { displayName: true, phone: true } },
        table: { select: { name: true } },
        timeSlot: { select: { name: true, startTime: true } },
        payment: { select: { amount: true, status: true } },
      },
    }),
    prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.reservation.count({ where }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-wide" style={{ color: "#1A237E" }}>
          預約總覽
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(26,35,126,0.5)" }}>
          {total} 筆預約{reservations.length < total ? `（顯示前 ${reservations.length} 筆）` : ""}
        </p>
      </div>

      {/* Filters */}
      <Suspense>
        <ReservationFilters tenants={tenants} />
      </Suspense>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ border: "1px solid rgba(57,73,171,0.15)" }}
      >
        {/* Header */}
        <div
          className="px-5 py-3 grid grid-cols-12 gap-3 text-xs font-semibold tracking-wider"
          style={{
            background: "linear-gradient(135deg, #1A237E, #0D1757)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <div className="col-span-2">日期</div>
          <div className="col-span-2">租戶</div>
          <div className="col-span-2">會員</div>
          <div className="col-span-1">桌號</div>
          <div className="col-span-1">時段</div>
          <div className="col-span-1 text-center">人數</div>
          <div className="col-span-1 text-center">狀態</div>
          <div className="col-span-1 text-right">金額</div>
          <div className="col-span-1 text-right">付款</div>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-16 bg-white text-sm" style={{ color: "rgba(57,73,171,0.3)" }}>
            此條件無預約紀錄
          </div>
        ) : (
          <div className="bg-white divide-y" style={{ borderColor: "rgba(57,73,171,0.08)" }}>
            {reservations.map((r) => (
              <div
                key={r.id}
                className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-indigo-50/30 transition-colors"
              >
                {/* Date */}
                <div className="col-span-2">
                  <p className="text-sm font-medium" style={{ color: "#1A237E" }}>
                    {new Date(r.date).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" })}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(57,73,171,0.4)" }}>
                    {new Date(r.date).toLocaleDateString("zh-TW", { weekday: "short" })}
                  </p>
                </div>

                {/* Tenant */}
                <div className="col-span-2 min-w-0">
                  <span className="text-sm truncate block font-medium" style={{ color: "#1A237E" }}>
                    {r.tenant.name}
                  </span>
                </div>

                {/* User */}
                <div className="col-span-2 min-w-0">
                  <p className="text-sm truncate" style={{ color: "#374151" }}>
                    {r.user.displayName ?? "—"}
                  </p>
                  {r.user.phone && (
                    <p className="text-xs" style={{ color: "rgba(57,73,171,0.4)" }}>{r.user.phone}</p>
                  )}
                </div>

                {/* Table */}
                <div className="col-span-1">
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "#EEF2FF", color: "#5C6BC0" }}>
                    {r.table.name}
                  </span>
                </div>

                {/* TimeSlot */}
                <div className="col-span-1">
                  <p className="text-xs" style={{ color: "#374151" }}>{r.timeSlot.name}</p>
                  <p className="text-xs" style={{ color: "rgba(57,73,171,0.4)" }}>{r.timeSlot.startTime}</p>
                </div>

                {/* Guest count */}
                <div className="col-span-1 text-center text-sm" style={{ color: "#374151" }}>
                  {r.guestCount}
                </div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={statusStyle[r.status] ?? { background: "#F3F4F6", color: "#6B7280" }}
                  >
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </div>

                {/* Amount */}
                <div className="col-span-1 text-right text-sm" style={{ color: "#374151" }}>
                  {r.payment ? `NT$${r.payment.amount.toLocaleString()}` : "—"}
                </div>

                {/* Payment status */}
                <div className="col-span-1 text-right">
                  {r.payment ? (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={
                        r.payment.status === "paid"
                          ? { background: "#DCFCE7", color: "#166534" }
                          : { background: "#FEF9C3", color: "#854D0E" }
                      }
                    >
                      {r.payment.status === "paid" ? "已付" : "未付"}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "rgba(57,73,171,0.25)" }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
