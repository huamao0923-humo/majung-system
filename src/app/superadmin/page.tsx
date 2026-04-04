import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { redirect } from "next/navigation";
import { Building2, Users, CalendarCheck, DollarSign } from "lucide-react";

export default async function SuperAdminDashboard() {
  const { error } = await requireSuperAdmin();
  if (error) redirect("/superadmin/login");

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalTenants, activeTenants, totalUsers, todayReservations, monthRevenue, recentTenants] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "member" } }),
      prisma.reservation.count({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
          status: { in: ["pending", "confirmed", "checked_in"] },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: "paid",
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          _count: { select: { users: true, reservations: true } },
        },
      }),
    ]);

  const stats = [
    { label: "活躍租戶數", value: `${activeTenants} / ${totalTenants}`, icon: Building2, accent: true },
    { label: "總用戶數", value: totalUsers, icon: Users, accent: false },
    { label: "今日預約", value: todayReservations, icon: CalendarCheck, accent: false },
    { label: "本月收入", value: `NT$${(monthRevenue._sum.amount ?? 0).toLocaleString()}`, icon: DollarSign, accent: false },
  ];

  const dateStr = today.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: "#1A237E" }}>
            儀表板
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,35,126,0.5)" }}>
            {dateStr}
          </p>
        </div>
        <div className="flex gap-1 opacity-20 select-none">
          {["中", "發", "白"].map((c, i) => (
            <div
              key={c}
              className="w-6 h-8 rounded-sm flex items-center justify-center font-bold text-xs"
              style={{
                background: "linear-gradient(150deg, #fff, #e8eaf6)",
                border: "1.5px solid #3949AB",
                color: i === 0 ? "#C62828" : i === 1 ? "#1B5E20" : "#333",
                boxShadow: "1px 2px 3px rgba(0,0,0,0.15)",
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
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl p-5 shadow-sm"
            style={{
              background: accent
                ? "linear-gradient(135deg, #1A237E, #0D1757)"
                : "white",
              border: accent ? "none" : "1px solid rgba(57,73,171,0.15)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: accent ? "rgba(99,120,255,0.15)" : "#EEF2FF",
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: accent ? "#7986CB" : "#3949AB" }}
              />
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: accent ? "#fff" : "#1A237E" }}
            >
              {value}
            </p>
            <p
              className="text-sm mt-1"
              style={{
                color: accent ? "rgba(255,255,255,0.5)" : "rgba(57,73,171,0.5)",
              }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent tenants */}
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ border: "1px solid rgba(57,73,171,0.15)" }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #1A237E, #0D1757)",
            borderBottom: "1px solid rgba(99,120,255,0.15)",
          }}
        >
          <h2 className="font-semibold tracking-wide text-white">最近租戶</h2>
          <a
            href="/superadmin/tenants"
            className="text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
            style={{ background: "rgba(99,120,255,0.2)", color: "#9FA8DA" }}
          >
            查看全部
          </a>
        </div>

        {recentTenants.length === 0 ? (
          <div className="text-center py-12 text-sm bg-white" style={{ color: "rgba(57,73,171,0.3)" }}>
            尚無租戶
          </div>
        ) : (
          <div className="bg-white divide-y" style={{ borderColor: "rgba(57,73,171,0.08)" }}>
            {recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(57,73,171,0.12), rgba(26,35,126,0.1))",
                      color: "#3949AB",
                    }}
                  >
                    {tenant.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: "#1A237E" }}>
                      {tenant.name}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(57,73,171,0.5)" }}>
                      /{tenant.slug} · {tenant._count.users} 用戶 · {tenant._count.reservations} 預約
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={
                      tenant.isActive
                        ? { background: "#DCFCE7", color: "#166534" }
                        : { background: "#FEE2E2", color: "#991B1B" }
                    }
                  >
                    {tenant.isActive ? "活躍" : "暫停"}
                  </span>
                  <a
                    href={`/superadmin/tenants/${tenant.id}`}
                    className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-indigo-100"
                    style={{ color: "#3949AB", border: "1px solid rgba(57,73,171,0.2)" }}
                  >
                    編輯
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
