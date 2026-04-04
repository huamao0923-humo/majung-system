import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, formatDate } from "@/lib/date";
import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import TenantCheckinButton from "./checkin-button";

export const dynamic = 'force-dynamic';

export default async function TenantCheckinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return notFound();

  const today = new Date();

  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId: tenant.id,
      date: { gte: startOfDay(today), lte: endOfDay(today) },
      status: { in: ["pending", "confirmed", "checked_in"] },
    },
    include: {
      user: { select: { displayName: true, phone: true, pictureUrl: true } },
      table: true,
      timeSlot: true,
    },
    orderBy: [{ timeSlot: { order: "asc" } }, { status: "asc" }],
  });

  const confirmed = reservations.filter((r) => r.status === "confirmed" || r.status === "pending");
  const checkedIn = reservations.filter((r) => r.status === "checked_in");

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>入場確認</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(139,0,0,0.5)" }}>
            {formatDate(today)} · 等候 {confirmed.length} 組 · 已入場 {checkedIn.length} 組
          </p>
        </div>
        <div className="text-3xl opacity-20 select-none">🀄</div>
      </div>

      {/* Progress bar */}
      {reservations.length > 0 && (
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: "white", border: "1px solid #D4AF3720" }}>
          <div className="flex items-center justify-between text-xs mb-2" style={{ color: "rgba(139,0,0,0.6)" }}>
            <span>入場進度</span>
            <span>{checkedIn.length} / {reservations.length}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#FDF6E3" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round((checkedIn.length / reservations.length) * 100)}%`,
                background: "linear-gradient(90deg, #8B0000, #D4AF37)",
              }}
            />
          </div>
        </div>
      )}

      {/* Waiting to check in */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: "#D4AF37" }} />
          <h2 className="text-sm font-semibold uppercase" style={{ color: "rgba(139,0,0,0.6)" }}>
            等候入場 ({confirmed.length})
          </h2>
        </div>
        {confirmed.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center text-sm"
            style={{ background: "white", border: "1px solid #D4AF3720", color: "rgba(139,0,0,0.3)" }}
          >
            目前無等候入場
          </div>
        ) : (
          <div className="space-y-3">
            {confirmed.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm"
                style={{ background: "white", border: "1px solid #D4AF3720" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(139,0,0,0.12), rgba(212,175,55,0.15))", color: "#8B0000" }}
                  >
                    {r.user.displayName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "#1A0500" }}>{r.user.displayName}</p>
                    <p className="text-sm" style={{ color: "rgba(139,0,0,0.55)" }}>
                      {r.table.name} · {r.timeSlot.name} · {r.guestCount}人
                    </p>
                    {r.user.phone && (
                      <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{r.user.phone}</p>
                    )}
                  </div>
                </div>
                <TenantCheckinButton reservationId={r.id} slug={slug} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Already checked in */}
      {checkedIn.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <h2 className="text-sm font-semibold uppercase" style={{ color: "rgba(139,0,0,0.5)" }}>
              已入場 ({checkedIn.length})
            </h2>
          </div>
          <div className="space-y-2">
            {checkedIn.map((r) => (
              <div
                key={r.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between opacity-60"
                style={{ background: "white", border: "1px solid #D4AF3715" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A0500" }}>{r.user.displayName}</p>
                  <p className="text-xs" style={{ color: "rgba(139,0,0,0.5)" }}>{r.table.name} · {r.timeSlot.name}</p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#DBEAFE", color: "#1E40AF" }}
                >
                  已入場
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
