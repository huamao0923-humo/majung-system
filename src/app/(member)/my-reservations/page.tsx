import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/date";
import { CalendarOff } from "lucide-react";
import CancelButton from "./cancel-button";

export const dynamic = 'force-dynamic';

const statusMap: Record<string, { label: string; bg: string; text: string }> = {
  pending:    { label: "待確認", bg: "#FEF9C3", text: "#854D0E" },
  confirmed:  { label: "已確認", bg: "#DCFCE7", text: "#166534" },
  checked_in: { label: "已入場", bg: "#DBEAFE", text: "#1E40AF" },
  completed:  { label: "已完成", bg: "#F3F4F6", text: "#6B7280" },
  cancelled:  { label: "已取消", bg: "#FEE2E2", text: "#991B1B" },
};

export default async function MyReservationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: { table: true, timeSlot: true, payment: true },
    orderBy: { date: "desc" },
  });

  const upcoming = reservations.filter((r) => r.status !== "cancelled" && r.status !== "completed");
  const past = reservations.filter((r) => r.status === "completed" || r.status === "cancelled");

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", borderBottom: "1px solid rgba(212,175,55,0.3)" }}
      >
        <Link href="/" className="p-1 -ml-1" style={{ color: "rgba(212,175,55,0.8)" }}>
          ←
        </Link>
        <h1 className="font-semibold" style={{ color: "#D4AF37" }}>我的預約</h1>
      </div>

      <div className="px-4 py-5 space-y-6 pb-8" style={{ background: "#FDF6E3", minHeight: "calc(100vh - 56px)" }}>
        {/* Upcoming */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #8B0000, #D4AF37)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "rgba(139,0,0,0.65)" }}>即將到來</h2>
          </div>
          {upcoming.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}
            >
              <CalendarOff className="w-10 h-10 mx-auto mb-2" style={{ color: "rgba(139,0,0,0.25)" }} />
              <p className="text-sm" style={{ color: "rgba(139,0,0,0.45)" }}>目前沒有預約</p>
              <Link
                href="/reserve"
                className="text-sm font-semibold mt-2 inline-block"
                style={{ color: "#8B0000" }}
              >
                立即預約 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r) => {
                const s = statusMap[r.status];
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl shadow-sm p-4"
                    style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold" style={{ color: "#1A0500" }}>{r.table.name}</p>
                        <p className="text-sm" style={{ color: "rgba(139,0,0,0.6)" }}>
                          {formatDate(r.date)} · {r.timeSlot.name}
                        </p>
                        <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>
                          {r.timeSlot.startTime}~{r.timeSlot.endTime} · {r.guestCount}人
                        </p>
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: s.bg, color: s.text }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {r.payment && (
                      <div
                        className="flex items-center justify-between text-xs mt-2 pt-2"
                        style={{ borderTop: "1px solid rgba(212,175,55,0.15)" }}
                      >
                        <span style={{ color: "rgba(139,0,0,0.5)" }}>費用 NT${r.payment.amount}</span>
                        <span
                          className="font-medium"
                          style={{ color: r.payment.status === "paid" ? "#166534" : "#D97706" }}
                        >
                          {r.payment.status === "paid" ? "已繳費" : "待繳費"}
                        </span>
                      </div>
                    )}
                    {(r.status === "pending" || r.status === "confirmed") && (
                      <div className="mt-3">
                        <CancelButton reservationId={r.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 rounded-full" style={{ background: "rgba(139,0,0,0.2)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "rgba(139,0,0,0.5)" }}>歷史紀錄</h2>
            </div>
            <div className="space-y-2">
              {past.map((r) => {
                const s = statusMap[r.status];
                return (
                  <div
                    key={r.id}
                    className="rounded-xl px-4 py-3 flex items-center justify-between opacity-60"
                    style={{ background: "white", border: "1px solid rgba(212,175,55,0.15)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1A0500" }}>
                        {r.table.name} · {r.timeSlot.name}
                      </p>
                      <p className="text-xs" style={{ color: "rgba(139,0,0,0.5)" }}>{formatDate(r.date)}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.text }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
