"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

type ClosedDate = {
  id: string;
  date: string;
  reason: string | null;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function padDate(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y} 年 ${parseInt(m)} 月 ${parseInt(d)} 日`;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function ClosedDatesPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingDate, setTogglingDate] = useState<string | null>(null);

  const fetchClosedDates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/t/${slug}/closed-dates`);
      if (res.ok) {
        const data = await res.json();
        setClosedDates(data);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchClosedDates();
  }, [fetchClosedDates]);

  const closedSet = new Set(closedDates.map((d) => d.date));

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(dateStr: string) {
    if (togglingDate) return;
    if (closedSet.has(dateStr)) {
      // Toggle open immediately
      handleRemove(dateStr);
    } else {
      // Ask for reason before adding
      setPendingDate(dateStr);
      setReasonInput("");
    }
  }

  async function handleAdd() {
    if (!pendingDate || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/t/${slug}/closed-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: pendingDate, reason: reasonInput || null }),
      });
      if (res.ok) {
        const created = await res.json();
        setClosedDates((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
        setPendingDate(null);
        setReasonInput("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(dateStr: string) {
    if (togglingDate) return;
    setTogglingDate(dateStr);
    try {
      const res = await fetch(`/api/t/${slug}/closed-dates?date=${dateStr}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClosedDates((prev) => prev.filter((d) => d.date !== dateStr));
      }
    } finally {
      setTogglingDate(null);
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* 標題 */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>休息日管理</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
          點擊日期設定或取消休息日
        </p>
      </div>

      {/* 月曆 */}
      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ background: "white", border: "1px solid #D4AF3720" }}
      >
        {/* 月份導覽 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-opacity hover:opacity-70"
            style={{ background: "#FDF6E3", color: "#8B0000", border: "1px solid #D4AF3730" }}
          >
            ‹
          </button>
          <span className="font-semibold text-base" style={{ color: "#1A0500" }}>
            {viewYear} 年 {viewMonth + 1} 月
          </span>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-opacity hover:opacity-70"
            style={{ background: "#FDF6E3", color: "#8B0000", border: "1px solid #D4AF3730" }}
          >
            ›
          </button>
        </div>

        {/* 星期表頭 */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className="text-center text-xs font-semibold py-1"
              style={{ color: i === 0 || i === 6 ? "#DC2626" : "rgba(139,0,0,0.5)" }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const dateStr = `${viewYear}-${padDate(viewMonth + 1)}-${padDate(day)}`;
            const isClosed = closedSet.has(dateStr);
            const isToday =
              day === today.getDate() &&
              viewMonth === today.getMonth() &&
              viewYear === today.getFullYear();
            const isToggling = togglingDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                disabled={isToggling}
                className="aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center disabled:opacity-50"
                style={
                  isClosed
                    ? {
                        background: "linear-gradient(135deg, #8B0000, #5C0000)",
                        color: "#FFF5F5",
                        border: "1px solid #8B000080",
                      }
                    : isToday
                    ? {
                        background: "#FEF3C7",
                        color: "#92400E",
                        border: "1px solid #FCD34D",
                        fontWeight: 700,
                      }
                    : {
                        background: "transparent",
                        color: "#1A0500",
                        border: "1px solid transparent",
                      }
                }
              >
                {isToggling ? "…" : day}
              </button>
            );
          })}
        </div>

        {/* 圖例 */}
        <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: "1px solid #D4AF3715" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)" }} />
            <span className="text-xs" style={{ color: "rgba(139,0,0,0.6)" }}>休息日</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ background: "#FEF3C7", border: "1px solid #FCD34D" }} />
            <span className="text-xs" style={{ color: "rgba(139,0,0,0.6)" }}>今日</span>
          </div>
        </div>
      </div>

      {/* 新增休息日 Modal */}
      {pendingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl"
            style={{ background: "white", border: "1px solid #D4AF3730" }}
          >
            <h2 className="text-base font-bold mb-1" style={{ color: "#1A0500" }}>設定休息日</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(139,0,0,0.6)" }}>
              {formatDateDisplay(pendingDate)}
            </p>
            <label className="block text-xs font-medium mb-1" style={{ color: "#1A0500" }}>
              原因（選填）
            </label>
            <input
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="例：國定假日、館內整修…"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-4"
              style={{
                background: "#FDF6E3",
                border: "1px solid rgba(212,175,55,0.3)",
                color: "#1A0500",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setPendingDate(null); setReasonInput(""); }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "#F3F4F6", color: "#6B7280" }}
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
              >
                {submitting ? "儲存中…" : "設定休息日"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 休息日清單 */}
      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ border: "1px solid #D4AF3720" }}
      >
        <div
          className="px-5 py-3 text-xs font-semibold uppercase"
          style={{
            background: "linear-gradient(135deg, #1A0500, #0D0200)",
            color: "rgba(212,175,55,0.6)",
          }}
        >
          所有休息日（{closedDates.length} 天）
        </div>

        {loading ? (
          <div
            className="py-10 text-center text-sm"
            style={{ background: "white", color: "rgba(139,0,0,0.3)" }}
          >
            載入中…
          </div>
        ) : closedDates.length === 0 ? (
          <div
            className="py-10 text-center text-sm"
            style={{ background: "white", color: "rgba(139,0,0,0.3)" }}
          >
            尚未設定任何休息日
          </div>
        ) : (
          <div className="bg-white divide-y" style={{ borderColor: "#D4AF3715" }}>
            {closedDates.map((cd) => (
              <div key={cd.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A0500" }}>
                    {formatDateDisplay(cd.date)}
                  </p>
                  {cd.reason && (
                    <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
                      {cd.reason}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(cd.date)}
                  disabled={togglingDate === cd.date}
                  className="text-xs px-3 py-1 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-40 flex-shrink-0"
                  style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}
                >
                  {togglingDate === cd.date ? "移除中…" : "取消休息"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
