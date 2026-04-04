"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  price: number;
  isActive: boolean;
}

export default function TimeSlotsSection({ timeSlots }: { timeSlots: TimeSlot[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", startTime: "", endTime: "", price: 0 });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleToggle(id: string, isActive: boolean) {
    await fetch("/api/timeslots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`確定要刪除「${name}」時段嗎？`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/timeslots?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`「${name}」已刪除`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "刪除失敗");
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAdd() {
    if (!form.name || !form.startTime || !form.endTime) return;
    setAdding(true);
    try {
      const res = await fetch("/api/timeslots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, order: timeSlots.length }),
      });
      if (res.ok) {
        toast.success("時段已新增");
        setForm({ name: "", startTime: "", endTime: "", price: 0 });
        router.refresh();
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "white", border: "1px solid #D4AF3720" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #D4AF3715" }}>
        <h2 className="font-semibold" style={{ color: "#1A0500" }}>時段設定</h2>
        <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>管理早場、午場、晚場等時段</p>
      </div>

      <div className="p-5 space-y-3">
        {/* 現有時段 */}
        <div className="space-y-2">
          {timeSlots.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl px-4 py-3 group"
              style={{
                border: "1px solid #D4AF3720",
                background: s.isActive ? "white" : "#FAFAFA",
                opacity: s.isActive ? 1 : 0.65,
              }}
            >
              <div>
                <p className="font-medium text-sm" style={{ color: "#1A0500" }}>{s.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.45)" }}>
                  {s.startTime} ～ {s.endTime} · NT${s.price}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(s.id, s.isActive)}
                  className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                  style={
                    s.isActive
                      ? { background: "#DCFCE7", color: "#166534" }
                      : { background: "#F3F4F6", color: "#6B7280" }
                  }
                >
                  {s.isActive ? "啟用中" : "已停用"}
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  disabled={deletingId === s.id}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                  style={{ background: "#FEE2E2", color: "#991B1B" }}
                  title="刪除此時段"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 新增時段 */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "#FDF6E3", border: "1px dashed rgba(212,175,55,0.4)" }}
        >
          <p className="text-xs font-semibold tracking-wide" style={{ color: "rgba(139,0,0,0.6)" }}>
            新增時段
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="名稱（如：早場）"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
            />
            <input
              type="number"
              placeholder="費用 (NT$)"
              value={form.price || ""}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
            />
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
            />
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !form.name || !form.startTime || !form.endTime}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
          >
            <Plus className="w-4 h-4" /> 新增時段
          </button>
        </div>
      </div>
    </div>
  );
}
