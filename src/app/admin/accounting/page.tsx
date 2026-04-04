import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime, startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/date";
import ExportButton from "./export-button";

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type ?? "day";
  const dateStr = sp.date ?? new Date().toISOString().split("T")[0];
  const d = new Date(dateStr);

  const start = type === "month" ? startOfMonth(d) : startOfDay(d);
  const end = type === "month" ? endOfMonth(d) : endOfDay(d);

  const payments = await prisma.payment.findMany({
    where: {
      status: "paid",
      paidAt: { gte: start, lte: end },
    },
    include: {
      reservation: {
        include: {
          user: { select: { displayName: true, phone: true } },
          table: true,
          timeSlot: true,
        },
      },
    },
    orderBy: { paidAt: "asc" },
  });

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const bySlot: Record<string, { name: string; count: number; amount: number }> = {};
  for (const p of payments) {
    const name = p.reservation.timeSlot.name;
    if (!bySlot[name]) bySlot[name] = { name, count: 0, amount: 0 };
    bySlot[name].count++;
    bySlot[name].amount += p.amount;
  }

  const byMethod: Record<string, number> = {};
  for (const p of payments) {
    const m = p.method ?? "現金";
    byMethod[m] = (byMethod[m] ?? 0) + p.amount;
  }

  const csvData = payments.map((p) => ({
    日期: formatDate(p.reservation.date),
    會員: p.reservation.user.displayName,
    電話: p.reservation.user.phone ?? "",
    桌位: p.reservation.table.name,
    時段: p.reservation.timeSlot.name,
    人數: p.reservation.guestCount,
    金額: p.amount,
    付款方式: p.method ?? "現金",
    付款時間: p.paidAt ? formatDateTime(p.paidAt) : "",
  }));

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>帳務報表</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(139,0,0,0.5)" }}>
            {type === "month" ? "月報" : "日報"} · {dateStr.substring(0, type === "month" ? 7 : 10)}
          </p>
        </div>
        <ExportButton data={csvData} filename={`帳務_${dateStr}`} />
      </div>

      {/* Filters */}
      <form method="GET" className="rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap" style={{ background: "white", border: "1px solid #D4AF3720" }}>
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #D4AF3730" }}>
          {[{ value: "day", label: "日報" }, { value: "month", label: "月報" }].map(({ value, label }) => (
            <button
              key={value}
              type="submit"
              name="type"
              value={value}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={
                type === value
                  ? { background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }
                  : { background: "white", color: "rgba(139,0,0,0.6)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type={type === "month" ? "month" : "date"}
          name="date"
          defaultValue={type === "month" ? dateStr.substring(0, 7) : dateStr}
          className="rounded-xl px-3 py-2 text-sm focus:outline-none"
          style={{ border: "1px solid #D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
        />
        <button
          type="submit"
          className="text-sm px-5 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
        >
          查詢
        </button>
      </form>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-5 shadow-sm col-span-2 lg:col-span-1"
          style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", border: "none" }}
        >
          <p className="text-xs mb-1" style={{ color: "rgba(212,175,55,0.6)" }}>總收入</p>
          <p className="text-2xl font-bold" style={{ color: "#D4AF37" }}>NT${totalAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: "white", border: "1px solid #D4AF3720" }}>
          <p className="text-xs mb-1" style={{ color: "rgba(139,0,0,0.5)" }}>總筆數</p>
          <p className="text-2xl font-bold" style={{ color: "#1A0500" }}>{payments.length}</p>
        </div>
        {Object.entries(bySlot).map(([name, data]) => (
          <div key={name} className="rounded-2xl p-5 shadow-sm" style={{ background: "white", border: "1px solid #D4AF3720" }}>
            <p className="text-xs mb-1" style={{ color: "rgba(139,0,0,0.5)" }}>{name}</p>
            <p className="text-xl font-bold" style={{ color: "#1A0500" }}>NT${data.amount.toLocaleString()}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.4)" }}>{data.count} 筆</p>
          </div>
        ))}
      </div>

      {/* Payment method breakdown */}
      {Object.keys(byMethod).length > 0 && (
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: "white", border: "1px solid #D4AF3720" }}>
          <h2 className="font-semibold mb-3" style={{ color: "#1A0500" }}>付款方式分析</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(byMethod).map(([method, amount]) => (
              <div key={method} className="rounded-xl px-4 py-2" style={{ background: "#FDF6E3", border: "1px solid #D4AF3720" }}>
                <span className="text-sm" style={{ color: "rgba(139,0,0,0.65)" }}>{method}：</span>
                <span className="font-semibold" style={{ color: "#1A0500" }}>NT${amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail table */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #D4AF3720" }}>
        <div
          className="px-5 py-4"
          style={{ background: "linear-gradient(135deg, #1A0500, #0D0200)", borderBottom: "1px solid #D4AF3725" }}
        >
          <h2 className="font-semibold" style={{ color: "#D4AF37" }}>明細列表</h2>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-sm bg-white" style={{ color: "rgba(139,0,0,0.3)" }}>
            此期間無收入紀錄
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#FDF6E3", borderBottom: "1px solid #D4AF3720" }}>
                  {["會員", "桌位/時段", "金額", "付款方式", "時間"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold uppercase ${h === "金額" ? "text-right" : "text-left"}`}
                      style={{ color: "rgba(139,0,0,0.5)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#D4AF3710" }}>
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: "#1A0500" }}>{p.reservation.user.displayName}</p>
                      {p.reservation.user.phone && (
                        <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{p.reservation.user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: "rgba(61,10,0,0.8)" }}>
                      {p.reservation.table.name} · {p.reservation.timeSlot.name}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: "#166534" }}>
                      NT${p.amount}
                    </td>
                    <td className="px-4 py-3" style={{ color: "rgba(61,10,0,0.7)" }}>{p.method ?? "現金"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>
                      {p.paidAt ? formatDateTime(p.paidAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
