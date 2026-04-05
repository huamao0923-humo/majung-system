"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  price: number;
  isActive: boolean;
}

interface Props {
  timeSlots: TimeSlot[];
  slug: string;
}

export default function TenantTimeSlotsSection({ timeSlots, slug }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", startTime: "", endTime: "", price: 0 });
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", startTime: "", endTime: "", price: 0 });

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/t/${slug}/timeslots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (!res.ok) { toast.error("操作失敗"); return; }
    router.refresh();
  }

  async function handleSaveEdit(id: string) {
    if (!editForm.name || !editForm.startTime || !editForm.endTime) return;
    const res = await fetch(`/api/t/${slug}/timeslots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) { toast.error("更新失敗"); return; }
    toast.success("時段已更新");
    setEditId(null);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`確定刪除時段「${name}」？`)) return;
    const res = await fetch(`/api/t/${slug}/timeslots/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("刪除失敗"); return; }
    toast.success("時段已刪除");
    router.refresh();
  }

  async function handleAdd() {
    if (!form.name || !form.startTime || !form.endTime) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/t/${slug}/timeslots`, {
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

  function startEdit(s: TimeSlot) {
    setEditId(s.id);
    setEditForm({ name: s.name, startTime: s.startTime, endTime: s.endTime, price: s.price });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold text-gray-900">時段設定</h2>
      </div>
      <div className="p-5 space-y-3">
        <div className="space-y-2">
          {timeSlots.map((s) => (
            <div key={s.id} className="border border-gray-100 rounded-xl px-4 py-3">
              {editId === s.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="名稱"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="number"
                      placeholder="費用 (NT$)"
                      value={editForm.price || ""}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(s.id)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg"
                    >
                      <Check className="w-3 h-3" /> 儲存
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg"
                    >
                      <X className="w-3 h-3" /> 取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.startTime} ~ {s.endTime} · NT${s.price}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(s.id, s.isActive)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        s.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {s.isActive ? "啟用中" : "已停用"}
                    </button>
                    <button
                      onClick={() => startEdit(s)}
                      className="p-1 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50"
                      title="編輯"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                      title="刪除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">新增時段</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="名稱（如：早場）"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="number"
              placeholder="費用 (NT$)"
              value={form.price || ""}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="mt-2 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> 新增時段
          </button>
        </div>
      </div>
    </div>
  );
}
