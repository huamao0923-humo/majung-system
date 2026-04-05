"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

export default function TenantSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    startTransition(() => router.push(`?${params}`));
  }

  const currentStatus = searchParams.get("status") ?? "";

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
          style={{ color: "rgba(57,73,171,0.4)" }}
        />
        <input
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
          placeholder="搜尋館名或 Slug…"
          className="w-full pl-8 pr-3 py-2 text-sm outline-none rounded-xl"
          style={{
            background: "white",
            border: "1px solid rgba(57,73,171,0.2)",
            color: "#1A237E",
          }}
        />
      </div>
      <div className="flex gap-1">
        {(["all", "active", "suspended"] as const).map((val) => {
          const label = { all: "全部", active: "活躍", suspended: "暫停" }[val];
          const active = val === "all" ? currentStatus === "" : currentStatus === val;
          return (
            <button
              key={val}
              onClick={() => update("status", val === "all" ? "" : val)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={
                active
                  ? { background: "#1A237E", color: "#fff" }
                  : {
                      background: "white",
                      color: "#3949AB",
                      border: "1px solid rgba(57,73,171,0.2)",
                    }
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
