"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Pencil, Trash2, UserPlus, AlertTriangle } from "lucide-react";

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

// ── Modal 元件 ────────────────────────────────────────────
function MemberModal({
  mode,
  member,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  member?: Member;
  onClose: () => void;
  onSave: (data: { displayName: string; phone: string; noShowCount?: number; isBlacklisted?: boolean }) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(member?.displayName ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [noShowCount, setNoShowCount] = useState(String(member?.noShowCount ?? 0));
  const [isBlacklisted, setIsBlacklisted] = useState(member?.isBlacklisted ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setError("姓名不得為空"); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({
        displayName,
        phone,
        ...(mode === "edit" ? { noShowCount: parseInt(noShowCount) || 0, isBlacklisted } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white" }}>
        {/* 標題 */}
        <div
          className="px-6 py-4"
          style={{ background: "linear-gradient(135deg, #1A0500, #0D0200)", borderBottom: "1px solid #D4AF3725" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "#D4AF37" }}>
            {mode === "create" ? "新增會員" : "編輯會員"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6B4C2A" }}>
              姓名 <span style={{ color: "#8B0000" }}>*</span>
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="請輸入姓名"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "#FDF6E3", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6B4C2A" }}>電話</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="請輸入電話"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "#FDF6E3", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
            />
          </div>

          {mode === "edit" && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6B4C2A" }}>爽約次數</label>
                <input
                  type="number"
                  min="0"
                  value={noShowCount}
                  onChange={(e) => setNoShowCount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "#FDF6E3", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className="relative w-10 h-6 rounded-full transition-colors"
                  style={{ background: isBlacklisted ? "#8B0000" : "#D1D5DB" }}
                  onClick={() => setIsBlacklisted((v) => !v)}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ left: isBlacklisted ? "calc(100% - 20px)" : "4px" }}
                  />
                </div>
                <span className="text-sm" style={{ color: "#1A0500" }}>
                  {isBlacklisted ? "黑名單（禁止預約）" : "狀態正常"}
                </span>
              </label>
            </>
          )}

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "#F3F4F6", color: "#374151" }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
            >
              {saving ? "儲存中…" : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 刪除確認 Modal ─────────────────────────────────────────
function DeleteConfirmModal({
  memberName,
  onClose,
  onConfirm,
}: {
  memberName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white" }}>
        <div className="px-6 py-5 text-center space-y-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "#FEE2E2" }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: "#DC2626" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "#1A0500" }}>
            確定要刪除「{memberName}」？
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>此操作無法復原，相關預約記錄也會一併刪除。</p>
        </div>
        <div className="flex border-t" style={{ borderColor: "#F3F4F6" }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium"
            style={{ color: "#6B7280" }}
          >
            取消
          </button>
          <div className="w-px" style={{ background: "#F3F4F6" }} />
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-3 text-sm font-semibold disabled:opacity-60"
            style={{ color: "#DC2626" }}
          >
            {deleting ? "刪除中…" : "確定刪除"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 主頁面 ─────────────────────────────────────────────────
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

  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const [cleaningDemo, setCleaningDemo] = useState(false);

  const fetchMembers = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(currentPage), ...(currentSearch ? { search: currentSearch } : {}) });
      const res = await fetch(`/api/t/${slug}/members?${sp}`);
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

  useEffect(() => { fetchMembers(page, search); }, [fetchMembers, page, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  async function handleCreate(data: { displayName: string; phone: string }) {
    const res = await fetch(`/api/t/${slug}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "新增失敗");
    }
    await fetchMembers(1, search);
    setPage(1);
  }

  async function handleEdit(data: { displayName: string; phone: string; noShowCount?: number; isBlacklisted?: boolean }) {
    if (!editMember) return;
    const res = await fetch(`/api/t/${slug}/members/${editMember.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("更新失敗");
    const updated = await res.json();
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  async function handleDelete() {
    if (!deleteMember) return;
    const res = await fetch(`/api/t/${slug}/members/${deleteMember.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("刪除失敗");
    setMembers((prev) => prev.filter((m) => m.id !== deleteMember.id));
    setTotal((t) => t - 1);
  }

  async function handleCleanDemo() {
    if (!confirm("確定要刪除所有 Demo 測試會員？")) return;
    setCleaningDemo(true);
    try {
      const res = await fetch(`/api/t/${slug}/members`, { method: "DELETE" });
      if (res.ok) {
        const { deleted } = await res.json();
        alert(`已刪除 ${deleted} 位測試會員`);
        await fetchMembers(1, search);
        setPage(1);
      }
    } finally {
      setCleaningDemo(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* 標題列 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>會員管理</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>共 {total} 位會員</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCleanDemo}
            disabled={cleaningDemo}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
          >
            {cleaningDemo ? "清除中…" : "清除 Demo 用戶"}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
          >
            <UserPlus className="w-4 h-4" />
            新增會員
          </button>
        </div>
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
            style={{ background: "#FDF6E3", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
          >
            搜尋
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
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
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #D4AF3720" }}>
          {/* 表頭 */}
          <div
            className="px-5 py-3 grid items-center text-xs font-semibold uppercase"
            style={{
              gridTemplateColumns: "1fr 72px 72px 90px 110px",
              background: "linear-gradient(135deg, #1A0500, #0D0200)",
              color: "rgba(212,175,55,0.6)",
              borderBottom: "1px solid #D4AF3725",
            }}
          >
            <span>姓名 / 電話</span>
            <span className="text-center">預約</span>
            <span className="text-center">爽約</span>
            <span className="text-center">狀態</span>
            <span className="text-center">操作</span>
          </div>

          <div className="bg-white divide-y" style={{ borderColor: "#D4AF3715" }}>
            {members.map((m) => (
              <div
                key={m.id}
                className="px-5 py-3 grid items-center hover:bg-amber-50/30 transition-colors"
                style={{ gridTemplateColumns: "1fr 72px 72px 90px 110px" }}
              >
                {/* 姓名 / 電話 */}
                <div className="flex items-center gap-3 min-w-0">
                  {m.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.pictureUrl} alt={m.displayName} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
                    >
                      {m.displayName.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1A0500" }}>{m.displayName}</p>
                    {m.phone && <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{m.phone}</p>}
                  </div>
                </div>

                {/* 預約次數 */}
                <span className="text-center text-sm font-semibold" style={{ color: m._count.reservations > 0 ? "#166534" : "rgba(139,0,0,0.3)" }}>
                  {m._count.reservations}
                </span>

                {/* 爽約次數 */}
                <div className="text-center">
                  <span className="text-sm font-semibold" style={{ color: m.noShowCount > 0 ? "#DC2626" : "rgba(139,0,0,0.3)" }}>
                    {m.noShowCount}
                  </span>
                  {m.noShowCount > 2 && (
                    <span className="ml-1 text-[10px] px-1 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>警告</span>
                  )}
                </div>

                {/* 狀態 */}
                <div className="text-center">
                  {m.isBlacklisted ? (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
                      黑名單
                    </span>
                  ) : (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}>
                      正常
                    </span>
                  )}
                </div>

                {/* 操作 */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => setEditMember(m)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-amber-50"
                    title="編輯"
                    style={{ color: "#8B6914" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteMember(m)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                    title="刪除"
                    style={{ color: "#DC2626" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
              style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
            >
              上一頁
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
            >
              下一頁
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <MemberModal mode="create" onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      )}
      {editMember && (
        <MemberModal mode="edit" member={editMember} onClose={() => setEditMember(null)} onSave={handleEdit} />
      )}
      {deleteMember && (
        <DeleteConfirmModal
          memberName={deleteMember.displayName}
          onClose={() => setDeleteMember(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
