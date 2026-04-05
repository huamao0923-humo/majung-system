import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import SetAdminModal from "./set-admin-modal";

export const dynamic = 'force-dynamic';

export default async function SuperAdminTenantsPage() {
  const { error } = await requireSuperAdmin();
  if (error) redirect("/superadmin/login");

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, reservations: true } },
      users: {
        where: { role: "admin" },
        select: { id: true, username: true, displayName: true },
        take: 1,
      },
    },
  });

  const planLabel: Record<string, string> = {
    basic: "基本",
    pro: "專業",
    enterprise: "企業",
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: "#1A237E" }}>
            租戶管理
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,35,126,0.5)" }}>
            共 {tenants.length} 間租戶
          </p>
        </div>
        <Link
          href="/superadmin/tenants/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #3949AB, #1A237E)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(57,73,171,0.3)",
          }}
        >
          <Plus className="w-4 h-4" />
          新增租戶
        </Link>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ border: "1px solid rgba(57,73,171,0.15)" }}
      >
        {/* Table header */}
        <div
          className="px-5 py-3 grid grid-cols-12 gap-4 text-xs font-semibold tracking-wider"
          style={{
            background: "linear-gradient(135deg, #1A237E, #0D1757)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <div className="col-span-3">館名</div>
          <div className="col-span-2">Slug</div>
          <div className="col-span-1">方案</div>
          <div className="col-span-1">狀態</div>
          <div className="col-span-2">管理員帳號</div>
          <div className="col-span-1 text-right">用戶</div>
          <div className="col-span-1 text-right">預約</div>
          <div className="col-span-1 text-right">操作</div>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-16 bg-white text-sm" style={{ color: "rgba(57,73,171,0.3)" }}>
            尚無租戶，點擊右上角新增第一間
          </div>
        ) : (
          <div className="bg-white divide-y" style={{ borderColor: "rgba(57,73,171,0.08)" }}>
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-indigo-50/30 transition-colors"
              >
                {/* Name */}
                <div className="col-span-3 flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(57,73,171,0.1), rgba(26,35,126,0.08))",
                      color: "#3949AB",
                    }}
                  >
                    {tenant.name.charAt(0)}
                  </div>
                  <span className="font-medium text-sm truncate" style={{ color: "#1A237E" }}>
                    {tenant.name}
                  </span>
                </div>

                {/* Slug */}
                <div className="col-span-2">
                  <code
                    className="text-xs px-2 py-0.5 rounded-lg"
                    style={{ background: "#EEF2FF", color: "#5C6BC0" }}
                  >
                    /{tenant.slug}
                  </code>
                </div>

                {/* Plan */}
                <div className="col-span-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#F3F4F6", color: "#4B5563" }}
                  >
                    {planLabel[tenant.plan] ?? tenant.plan}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-1">
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
                </div>

                {/* Admin account */}
                <div className="col-span-2 flex items-center gap-1 min-w-0">
                  {tenant.users[0]?.username ? (
                    <code className="text-xs px-2 py-0.5 rounded-lg truncate"
                      style={{ background: "#DCFCE7", color: "#166534" }}>
                      {tenant.users[0].username}
                    </code>
                  ) : (
                    <span className="text-xs" style={{ color: "rgba(57,73,171,0.3)" }}>未設定</span>
                  )}
                  <SetAdminModal
                    tenantId={tenant.id}
                    tenantName={tenant.name}
                    currentUsername={tenant.users[0]?.username ?? null}
                  />
                </div>

                {/* User count */}
                <div className="col-span-1 text-right text-sm font-medium" style={{ color: "#1A237E" }}>
                  {tenant._count.users}
                </div>

                {/* Reservation count */}
                <div className="col-span-1 text-right text-sm" style={{ color: "rgba(57,73,171,0.6)" }}>
                  {tenant._count.reservations}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  <Link
                    href={`/superadmin/tenants/${tenant.id}`}
                    className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-indigo-100"
                    style={{ color: "#3949AB", border: "1px solid rgba(57,73,171,0.2)" }}
                  >
                    編輯
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
