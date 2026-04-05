"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
}

export default function ReservationFilters({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    startTransition(() => router.push(`?${params}`));
  }

  const currentRange = searchParams.get("dateRange") ?? "month";
  const currentTenant = searchParams.get("tenantId") ?? "";
  const currentStatus = searchParams.get("status") ?? "";

  const dateRanges = [
    { val: "today", label: "今日" },
    { val: "week", label: "本週" },
    { val: "month", label: "本月" },
    { val: "all", label: "全部" },
  ] as const;

  const statuses = [
    { val: "", label: "全部狀態" },
    { val: "pending", label: "待確認" },
    { val: "confirmed", label: "已確認" },
    { val: "checked_in", label: "已報到" },
    { val: "cancelled", label: "已取消" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {/* Date range */}
      <div className="flex gap-1">
        {dateRanges.map(({ val, label }) => {
          const active = currentRange === val || (val === "month" && !searchParams.get("dateRange"));
          return (
            <button
              key={val}
              onClick={() => update("dateRange", val === "all" ? "" : val)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={
                active
                  ? { background: "#1A237E", color: "#fff" }
                  : { background: "white", color: "#3949AB", border: "1px solid rgba(57,73,171,0.2)" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tenant filter */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: "rgba(57,73,171,0.4)" }}
        />
        <select
          value={currentTenant}
          onChange={(e) => update("tenantId", e.target.value)}
          className="pl-8 pr-8 py-2 text-sm rounded-xl appearance-none"
          style={{
            background: "white",
            border: "1px solid rgba(57,73,171,0.2)",
            color: currentTenant ? "#1A237E" : "rgba(57,73,171,0.5)",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="">所有租戶</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <div className="flex gap-1">
        {statuses.map(({ val, label }) => {
          const active = currentStatus === val;
          return (
            <button
              key={val || "all"}
              onClick={() => update("status", val)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={
                active
                  ? { background: "#1A237E", color: "#fff" }
                  : { background: "white", color: "#3949AB", border: "1px solid rgba(57,73,171,0.2)" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
