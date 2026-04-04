import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/date";
import BlacklistToggle from "./blacklist-toggle";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";

  const users = await prisma.user.findMany({
    where: {
      role: "member",
      ...(q
        ? {
            OR: [
              { displayName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      reservations: {
        where: { status: { in: ["completed", "checked_in"] } },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>會員管理</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
            共 {users.length} 位會員
          </p>
        </div>
      </div>

      {/* 搜尋列 */}
      <form
        method="GET"
        className="rounded-2xl p-4 shadow-sm"
        style={{ background: "white", border: "1px solid #D4AF3720" }}
      >
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜尋姓名或電話…"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: "#FDF6E3",
              border: "1px solid rgba(212,175,55,0.3)",
              color: "#1A0500",
            }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-85"
            style={{
              background: "linear-gradient(135deg, #8B0000, #6B0000)",
              color: "#D4AF37",
            }}
          >
            搜尋
          </button>
          {q && (
            <a
              href="/admin/members"
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "#F3F4F6", color: "#6B7280" }}
            >
              清除
            </a>
          )}
        </div>
      </form>

      {/* 列表 */}
      {users.length === 0 ? (
        <div
          className="rounded-2xl text-center py-14 text-sm"
          style={{ background: "white", border: "1px solid #D4AF3720", color: "rgba(139,0,0,0.3)" }}
        >
          找不到符合的會員
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ border: "1px solid #D4AF3720" }}
        >
          {/* Column header */}
          <div
            className="px-5 py-3 flex items-center gap-4 text-xs font-semibold uppercase"
            style={{
              background: "linear-gradient(135deg, #1A0500, #0D0200)",
              color: "rgba(212,175,55,0.6)",
              borderBottom: "1px solid #D4AF3725",
            }}
          >
            <span className="flex-1">會員</span>
            <span className="w-24 text-center">加入日期</span>
            <span className="w-16 text-center">完成預約</span>
            <span className="w-16 text-center">未到場</span>
            <span className="w-20 text-center">狀態</span>
          </div>

          <div className="bg-white divide-y" style={{ borderColor: "#D4AF3715" }}>
            {users.map((u) => {
              const completedCount = u.reservations.filter((r) => r.status === "completed").length;
              return (
                <div
                  key={u.id}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-amber-50/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: "#1A0500" }}>
                        {u.displayName}
                      </p>
                      {u.noShowCount >= 3 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "#FEF9C3", color: "#854D0E" }}
                        >
                          累積爽約 {u.noShowCount} 次
                        </span>
                      )}
                    </div>
                    {u.phone && (
                      <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{u.phone}</p>
                    )}
                  </div>
                  <span className="w-24 text-center text-xs" style={{ color: "#6B4C2A" }}>
                    {formatDate(u.createdAt)}
                  </span>
                  <span className="w-16 text-center text-sm font-semibold" style={{ color: completedCount > 0 ? "#166534" : "rgba(139,0,0,0.3)" }}>
                    {completedCount}
                  </span>
                  <span
                    className="w-16 text-center text-sm font-semibold"
                    style={{ color: u.noShowCount > 0 ? "#DC2626" : "rgba(139,0,0,0.3)" }}
                  >
                    {u.noShowCount}
                  </span>
                  <div className="w-20 text-center">
                    <BlacklistToggle id={u.id} isBlacklisted={u.isBlacklisted} />
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
