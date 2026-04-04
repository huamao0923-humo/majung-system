import { prisma } from "@/lib/prisma";
import { formatDate, startOfDay, endOfDay } from "@/lib/date";
import PaymentForm from "./payment-form";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const dateStr = sp.date ?? new Date().toISOString().split("T")[0];
  const d = new Date(dateStr);

  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: startOfDay(d), lte: endOfDay(d) },
      status: { in: ["checked_in", "completed"] },
    },
    include: {
      user: { select: { displayName: true, phone: true } },
      table: true,
      timeSlot: true,
      payment: true,
    },
    orderBy: [{ timeSlot: { order: "asc" } }],
  });

  const unpaid = reservations.filter((r) => r.payment?.status !== "paid");
  const paid = reservations.filter((r) => r.payment?.status === "paid");
  const totalRevenue = paid.reduce((sum, r) => sum + (r.payment?.amount ?? 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>繳費管理</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(139,0,0,0.5)" }}>
            今日收入：<span className="font-semibold" style={{ color: "#166534" }}>NT${totalRevenue.toLocaleString()}</span>
          </p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={dateStr}
            className="rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={{ border: "1px solid #D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
          />
          <button
            type="submit"
            className="text-sm px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
          >
            查詢
          </button>
        </form>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "待繳費", value: unpaid.length, color: "#D97706" },
          { label: "已繳費", value: paid.length,   color: "#166534" },
          { label: "今日收入", value: `NT$${totalRevenue.toLocaleString()}`, color: "#8B0000" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 text-center shadow-sm"
            style={{ background: "white", border: "1px solid #D4AF3720" }}
          >
            <p className="text-xs mb-1" style={{ color: "rgba(139,0,0,0.5)" }}>{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Unpaid */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h2 className="text-sm font-semibold uppercase" style={{ color: "rgba(139,0,0,0.6)" }}>
            待繳費 ({unpaid.length})
          </h2>
        </div>
        {unpaid.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center text-sm"
            style={{ background: "white", border: "1px solid #D4AF3720", color: "rgba(139,0,0,0.3)" }}
          >
            無待繳費紀錄
          </div>
        ) : (
          <div className="space-y-3">
            {unpaid.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl p-5 shadow-sm"
                style={{ background: "white", border: "1px solid #D4AF3720" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold" style={{ color: "#1A0500" }}>{r.user.displayName}</p>
                    <p className="text-sm" style={{ color: "rgba(139,0,0,0.55)" }}>
                      {r.table.name} · {r.timeSlot.name} · {r.guestCount}人
                    </p>
                    {r.user.phone && (
                      <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{r.user.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: "#8B0000" }}>NT${r.payment?.amount ?? 0}</p>
                    <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>應收金額</p>
                  </div>
                </div>
                {r.payment && <PaymentForm payment={{ id: r.payment.id, amount: r.payment.amount }} />}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Paid */}
      {paid.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <h2 className="text-sm font-semibold uppercase" style={{ color: "rgba(139,0,0,0.5)" }}>
              已繳費 ({paid.length})
            </h2>
          </div>
          <div className="space-y-2">
            {paid.map((r) => (
              <div
                key={r.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between opacity-65"
                style={{ background: "white", border: "1px solid #D4AF3715" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A0500" }}>{r.user.displayName}</p>
                  <p className="text-xs" style={{ color: "rgba(139,0,0,0.45)" }}>
                    {r.table.name} · {r.timeSlot.name} · {r.payment?.method ?? "現金"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: "#166534" }}>NT${r.payment?.amount}</p>
                  <p className="text-xs" style={{ color: "#166534", opacity: 0.7 }}>已收款</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
