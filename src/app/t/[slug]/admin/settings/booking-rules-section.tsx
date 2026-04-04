"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  slug: string;
  cancelDeadlineHours: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
}

export default function BookingRulesSection({
  slug,
  cancelDeadlineHours: initialCancel,
  minAdvanceHours: initialMin,
  maxAdvanceDays: initialMax,
}: Props) {
  const [cancelDeadlineHours, setCancelDeadlineHours] = useState(initialCancel);
  const [minAdvanceHours, setMinAdvanceHours] = useState(initialMin);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(initialMax);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/t/${slug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelDeadlineHours, minAdvanceHours, maxAdvanceDays }),
      });
      if (res.ok) {
        toast.success("預約規則已儲存");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "儲存失敗");
      }
    } catch {
      toast.error("網路錯誤，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #D4AF3720" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #D4AF3720" }}>
        <h2 className="font-semibold" style={{ color: "#1A0500" }}>預約規則設定</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(139,0,0,0.65)" }}>
              取消截止（場次前幾小時）
            </label>
            <input
              type="number"
              min={0}
              max={48}
              value={cancelDeadlineHours}
              onChange={(e) => setCancelDeadlineHours(Number(e.target.value))}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ borderColor: "#D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
            />
            <p className="text-xs mt-1" style={{ color: "rgba(139,0,0,0.4)" }}>0 – 48 小時</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(139,0,0,0.65)" }}>
              最少提前訂位（小時）
            </label>
            <input
              type="number"
              min={0}
              max={24}
              value={minAdvanceHours}
              onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ borderColor: "#D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
            />
            <p className="text-xs mt-1" style={{ color: "rgba(139,0,0,0.4)" }}>0 – 24 小時</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(139,0,0,0.65)" }}>
              最多提前訂位（天）
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={maxAdvanceDays}
              onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ borderColor: "#D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
            />
            <p className="text-xs mt-1" style={{ color: "rgba(139,0,0,0.4)" }}>1 – 60 天</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-5 py-2 rounded-xl font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
          >
            {saving ? "儲存中…" : "儲存規則"}
          </button>
        </div>
      </div>
    </div>
  );
}
