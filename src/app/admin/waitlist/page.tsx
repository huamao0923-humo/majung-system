import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/date";
import NotifyButton from "./notify-button";

export const dynamic = 'force-dynamic';

export default async function AdminWaitlistPage() {
  const entries = await prisma.waitlistEntry.findMany({
    include: {
      user: { select: { displayName: true, phone: true } },
      timeSlot: { select: { name: true, startTime: true } },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  // Group by date
  const grouped: Record<string, typeof entries> = {};
  for (const e of entries) {
    const key = e.date.toISOString().split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }
  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  const pendingCount = entries.filter((e) => !e.notified).length;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>候補名單</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
            共 {entries.length} 筆
            {pendingCount > 0 && (
              <span className="ml-2 font-semibold" style={{ color: "#8B0000" }}>
                · {pendingCount} 人尚未通知
              </span>
            )}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div
          className="rounded-2xl text-center py-14 text-sm"
          style={{ background: "white", border: "1px solid #D4AF3720", color: "rgba(139,0,0,0.3)" }}
        >
          目前沒有候補名單
        </div>
      ) : (
        <div className="space-y-4">
          {groupedEntries.map(([dateKey, rows]) => {
            const dateObj = new Date(dateKey + "T00:00:00");
            const today = new Date().toISOString().split("T")[0];
            const isToday = dateKey === today;
            const isPast = dateKey < today;

            return (
              <div
                key={dateKey}
                className="rounded-2xl overflow-hidden shadow-sm"
                style={{ border: "1px solid #D4AF3720", opacity: isPast ? 0.6 : 1 }}
              >
                {/* 日期 header */}
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
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37" }}
                    >
                      今天
                    </span>
                  )}
                  {isPast && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.1)", color: "rgba(212,175,55,0.5)" }}
                    >
                      已過
                    </span>
                  )}
                  <span className="text-xs ml-auto" style={{ color: "rgba(212,175,55,0.5)" }}>
                    {rows.length} 人
                  </span>
                </div>

                {/* Column header */}
                <div
                  className="px-5 py-2 flex items-center gap-4 text-xs font-semibold"
                  style={{ background: "#FAF7EE", color: "rgba(139,0,0,0.45)", borderBottom: "1px solid #D4AF3715" }}
                >
                  <span className="w-4 text-center">#</span>
                  <span className="flex-1">會員</span>
                  <span className="w-20">時段</span>
                  <span className="w-10 text-center">人數</span>
                  <span className="w-24 text-center">狀態</span>
                </div>

                <div className="bg-white divide-y" style={{ borderColor: "#D4AF3712" }}>
                  {rows.map((e, i) => (
                    <div
                      key={e.id}
                      className="px-5 py-3 flex items-center gap-4"
                    >
                      <span className="w-4 text-center text-xs" style={{ color: "rgba(139,0,0,0.3)" }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1A0500" }}>
                          {e.user.displayName}
                        </p>
                        {e.user.phone && (
                          <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{e.user.phone}</p>
                        )}
                      </div>
                      <span className="w-20 text-sm" style={{ color: "#3D0A00" }}>
                        {e.timeSlot.name}
                      </span>
                      <span className="w-10 text-center text-sm" style={{ color: "#3D0A00" }}>
                        {e.guestCount}
                      </span>
                      <div className="w-24 text-center">
                        <NotifyButton id={e.id} notified={e.notified} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
