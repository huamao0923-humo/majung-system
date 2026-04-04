"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

type Member = {
  id: string;
  displayName: string;
  pictureUrl: string | null;
  phone: string | null;
  isBlacklisted: boolean;
  noShowCount: number;
  createdAt: string;
  _count: { reservations: number };
};

export default function TenantMembersPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        ...(currentSearch ? { search: currentSearch } : {}),
      });
      const res = await fetch(`/api/t/${slug}/members?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.users);
        setTotal(data.total);
        setPageSize(data.pageSize);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMembers(page, search);
  }, [fetchMembers, page, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleClear() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  async function toggleBlacklist(member: Member) {
    if (togglingId) return;
    setTogglingId(member.id);
    try {
      const res = await fetch(`/api/t/${slug}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlacklisted: !member.isBlacklisted }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id ? { ...m, isBlacklisted: !m.isBlacklisted } : m
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* 標題 */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>會員管理</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
          共 {total} 位會員
        </p>
      </div>

      {/* 搜尋列 */}
      <form
        onSubmit={handleSearch}
        className="rounded-2xl p-4 shadow-sm"
        style={{ background: "white", border: "1px solid #D4AF3720" }}
      >
        <div className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
          {search && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "#F3F4F6", color: "#6B7280" }}
            >
              清除
            </button>
          )}
        </div>
      </form>

      {/* 列表 */}
      {loading ? (
        <div
          className="rounded-2xl text-center py-14 text-sm"
          style={{ background: "white", border: "1px solid #D4AF3720", color: "rgba(139,0,0,0.3)" }}
        >
          載入中…
        </div>
      ) : members.length === 0 ? (
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
          {/* 表頭 */}
          <div
            className="px-5 py-3 grid items-center text-xs font-semibold uppercase"
            style={{
              gridTemplateColumns: "1fr 80px 80px 100px 90px",
              background: "linear-gradient(135deg, #1A0500, #0D0200)",
              color: "rgba(212,175,55,0.6)",
              borderBottom: "1px solid #D4AF3725",
            }}
          >
            <span>姓名 / 電話</span>
            <span className="text-center">預約次數</span>
            <span className="text-center">爽約次數</span>
            <span className="text-center">黑名單</span>
            <span className="text-center">操作</span>
          </div>

          <div className="bg-white divide-y" style={{ borderColor: "#D4AF3715" }}>
            {members.map((m) => (
              <div
                key={m.id}
                className="px-5 py-3 grid items-center hover:bg-amber-50/30 transition-colors"
                style={{ gridTemplateColumns: "1fr 80px 80px 100px 90px" }}
              >
                {/* 姓名 / 電話 */}
                <div className="flex items-center gap-3 min-w-0">
                  {m.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.pictureUrl}
                      alt={m.displayName}
                      className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
                    >
                      {m.displayName.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1A0500" }}>
                      {m.displayName}
                    </p>
                    {m.phone && (
                      <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{m.phone}</p>
                    )}
                  </div>
                </div>

                {/* 預約次數 */}
                <span
                  className="text-center text-sm font-semibold"
                  style={{ color: m._count.reservations > 0 ? "#166534" : "rgba(139,0,0,0.3)" }}
                >
                  {m._count.reservations}
                </span>

                {/* 爽約次數 */}
                <div className="text-center">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: m.noShowCount > 0 ? "#DC2626" : "rgba(139,0,0,0.3)" }}
                  >
                    {m.noShowCount}
                  </span>
                  {m.noShowCount > 2 && (
                    <span
                      className="ml-1 text-[10px] px-1 py-0.5 rounded-full"
                      style={{ background: "#FEF3C7", color: "#92400E" }}
                    >
                      警告
                    </span>
                  )}
                </div>

                {/* 黑名單狀態 */}
                <div className="text-center">
                  {m.isBlacklisted ? (
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                    >
                      黑名單
                    </span>
                  ) : (
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}
                    >
                      正常
                    </span>
                  )}
                </div>

                {/* 操作 */}
                <div className="text-center">
                  <button
                    onClick={() => toggleBlacklist(m)}
                    disabled={togglingId === m.id}
                    className="text-xs px-2.5 py-1 rounded-full font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={
                      m.isBlacklisted
                        ? { background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB" }
                        : { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }
                    }
                  >
                    {togglingId === m.id ? "…" : m.isBlacklisted ? "解除" : "加入黑名單"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "rgba(139,0,0,0.5)" }}>
            第 {page} / {totalPages} 頁，共 {total} 筆
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #8B0000, #6B0000)",
                color: "#D4AF37",
              }}
            >
              上一頁
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #8B0000, #6B0000)",
                color: "#D4AF37",
              }}
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
