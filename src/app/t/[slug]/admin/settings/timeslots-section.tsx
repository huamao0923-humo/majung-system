"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/t/${slug}/timeslots`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
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

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold text-gray-900">時段設定</h2>
      </div>
      <div className="p-5 space-y-3">
        <div className="space-y-2">
          {timeSlots.map((s) => (
            <div key={s.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-sm text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.startTime} ~ {s.endTime} · NT${s.price}</p>
              </div>
              <button
                onClick={() => handleToggle(s.id, s.isActive)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {s.isActive ? "啟用中" : "已停用"}
              </button>
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
