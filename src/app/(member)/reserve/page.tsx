"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  price: number;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  isAvailable: boolean;
}

type Step = "datetime" | "table" | "confirm";

// 時段對應傳統牌字
const slotSuits = ["萬", "筒", "條"];

// 桌位平面圖位置（left%, top%），對應桌號 1-10
const FLOOR_POSITIONS: Record<number, { x: number; y: number }> = {
  1:  { x: 6,  y: 6  },
  2:  { x: 39, y: 6  },
  3:  { x: 72, y: 6  },
  4:  { x: 6,  y: 30 },
  5:  { x: 39, y: 30 },
  6:  { x: 72, y: 30 },
  7:  { x: 6,  y: 54 },
  8:  { x: 39, y: 54 },
  9:  { x: 72, y: 54 },
  10: { x: 39, y: 76 },
};

export default function ReservePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("datetime");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [guestCount, setGuestCount] = useState(4);
  const [note, setNote] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const dayLabels = ["日", "一", "二", "三", "四", "五", "六"];

  useEffect(() => {
    fetch("/api/timeslots").then((r) => r.json()).then(setTimeSlots);
  }, []);

  useEffect(() => {
    if (selectedDate && selectedSlot) {
      setLoading(true);
      fetch(`/api/tables?date=${selectedDate}&timeSlotId=${selectedSlot.id}`)
        .then((r) => r.json())
        .then(setTables)
        .finally(() => setLoading(false));
    }
  }, [selectedDate, selectedSlot]);

  async function handleSubmit() {
    if (!selectedDate || !selectedSlot || !selectedTable) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: selectedTable.id,
          timeSlotId: selectedSlot.id,
          date: selectedDate,
          guestCount,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "預約失敗，請稍後再試");
        return;
      }

      toast.success("預約成功！已傳送 LINE 確認通知");
      router.push("/my-reservations");
    } catch {
      toast.error("網路錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  const availableCount = useMemo(() => tables.filter((t) => t.isAvailable).length, [tables]);

  const stepLabels = ["選日期時段", "選桌位", "確認預約"];
  const stepKeys: Step[] = ["datetime", "table", "confirm"];
  const currentIdx = stepKeys.indexOf(step);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", borderBottom: "1px solid rgba(212,175,55,0.3)" }}
      >
        <button onClick={() => router.back()} className="p-1 -ml-1" style={{ color: "rgba(212,175,55,0.8)" }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold tracking-[0.15em]" style={{ color: "#D4AF37" }}>線上預約</h1>
      </div>

      {/* Steps indicator */}
      <div className="px-4 py-4 flex items-center gap-2 text-sm" style={{ background: "#FDF6E3" }}>
        {stepKeys.map((s, i) => {
          const done = i < currentIdx;
          const active = s === step;
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className="h-px w-6 flex-shrink-0"
                  style={{ background: done ? "#D4AF37" : "rgba(139,0,0,0.2)" }}
                />
              )}
              <div
                className="flex items-center gap-1.5"
                style={{ color: active ? "#8B0000" : done ? "#D4AF37" : "rgba(139,0,0,0.35)" }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #8B0000, #5C0000)"
                      : done
                      ? "linear-gradient(135deg, #D4AF37, #B8952E)"
                      : "rgba(139,0,0,0.1)",
                    color: active || done ? "white" : "rgba(139,0,0,0.4)",
                  }}
                >
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className="hidden sm:block text-xs font-medium">{stepLabels[i]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-6 space-y-4" style={{ background: "#FDF6E3" }}>
        {/* Step 1: Date & Time */}
        {step === "datetime" && (
          <>
            <div className="rounded-2xl shadow-sm p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="chinese-divider mb-4">
                <span className="font-bold text-xs tracking-[4px]" style={{ color: "rgba(212,175,55,0.8)", letterSpacing: "0.3em" }}>選擇日期</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {dates.map((d) => {
                  const date = new Date(d + "T00:00:00");
                  const day = date.getDay();
                  const isToday = d === dates[0];
                  const isSelected = d === selectedDate;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className="flex flex-col items-center rounded-xl py-2 px-1 transition-all text-xs"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, #8B0000, #5C0000)"
                          : "rgba(139,0,0,0.05)",
                        color: isSelected
                          ? "#D4AF37"
                          : (day === 0 || day === 6)
                          ? "#8B0000"
                          : "#3D0A00",
                        border: isSelected ? "1px solid rgba(212,175,55,0.4)" : "1px solid transparent",
                      }}
                    >
                      <span className="opacity-70 text-[10px]">{dayLabels[day]}</span>
                      <span className="font-semibold mt-0.5">{date.getDate()}</span>
                      {isToday && (
                        <div
                          className="w-1 h-1 rounded-full mt-0.5"
                          style={{ background: isSelected ? "#D4AF37" : "#8B0000" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl shadow-sm p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="chinese-divider mb-4">
                <span className="font-bold text-xs" style={{ color: "rgba(212,175,55,0.8)", letterSpacing: "0.3em" }}>選擇時段</span>
              </div>
              <div className="space-y-2">
                {timeSlots.map((slot, i) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all relative overflow-hidden"
                      style={{
                        borderColor: isSelected ? "#8B0000" : "rgba(212,175,55,0.2)",
                        background: isSelected ? "rgba(139,0,0,0.05)" : "#FDF6E3",
                      }}
                    >
                      {/* 花色字浮水印 */}
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl font-bold pointer-events-none select-none"
                        style={{
                          color: isSelected ? "rgba(139,0,0,0.08)" : "rgba(212,175,55,0.13)",
                          fontFamily: "serif",
                          lineHeight: 1,
                        }}
                      >
                        {slotSuits[i] ?? ""}
                      </span>
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: isSelected ? "#8B0000" : "#1A0500" }}>
                          {slot.name}
                        </p>
                        <p className="text-sm" style={{ color: "rgba(139,0,0,0.5)" }}>
                          {slot.startTime} ～ {slot.endTime}
                        </p>
                      </div>
                      <p className="font-bold text-lg relative z-10" style={{ color: isSelected ? "#8B0000" : "#D4AF37" }}>
                        NT${slot.price}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="w-full rounded-xl h-12 font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40"
              disabled={!selectedDate || !selectedSlot}
              onClick={() => setStep("table")}
              style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
            >
              下一步：選桌位 <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Step 2: Table selection */}
        {step === "table" && (
          <>
            <div className="rounded-2xl shadow-sm p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "#8B0000" }}>
                {selectedDate} · {selectedSlot?.name}
              </p>
              <h2 className="font-semibold mb-4" style={{ color: "#1A0500" }}>選擇桌位</h2>

              {loading ? (
                <div className="text-center py-12" style={{ color: "rgba(139,0,0,0.4)" }}>
                  <div
                    className="w-10 h-14 mx-auto mb-3 rounded-md flex items-center justify-center font-bold text-xl"
                    style={{
                      background: "linear-gradient(150deg, #fff, #f5f0e6)",
                      border: "2px solid #1B4D1B",
                      boxShadow: "2px 4px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9)",
                      color: "#1B4D1B",
                      fontFamily: "serif",
                      animation: "pulse 1.2s ease-in-out infinite",
                    }}
                  >
                    ?
                  </div>
                  <p className="text-sm">載入桌位中...</p>
                </div>
              ) : (
                <>
                  {/* 聽牌警示 */}
                  {availableCount > 0 && availableCount <= 2 && (
                    <div
                      className="rounded-xl px-4 py-2.5 mb-3 flex items-center gap-2.5"
                      style={{ background: "rgba(139,0,0,0.07)", border: "1px solid rgba(139,0,0,0.25)" }}
                    >
                      <div
                        className="w-7 h-9 rounded-sm flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: "linear-gradient(150deg, #fff, #f5f0e6)",
                          border: "1.5px solid #8B0000",
                          color: "#8B0000",
                          boxShadow: "1px 2px 3px rgba(0,0,0,0.18)",
                          fontFamily: "serif",
                        }}
                      >
                        聽
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#8B0000" }}>
                        聽牌！僅剩 {availableCount} 桌，手氣好的快搶！
                      </p>
                    </div>
                  )}

                  {/* 平面圖 */}
                  <div
                    className="relative w-full rounded-xl overflow-hidden select-none"
                    style={{
                      aspectRatio: "4 / 5",
                      background: "linear-gradient(160deg, #D4A853 0%, #C8983E 40%, #D4A853 100%)",
                      border: "3px solid rgba(139,0,0,0.25)",
                      boxShadow: "inset 0 0 40px rgba(0,0,0,0.1), 0 2px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    {/* 木紋地板 */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(
                            0deg,
                            rgba(0,0,0,0.04) 0px,
                            rgba(0,0,0,0.04) 1px,
                            transparent 1px,
                            transparent 20px
                          )
                        `,
                      }}
                    />
                    {/* 四邊框線 */}
                    <div
                      className="absolute inset-2 pointer-events-none rounded-lg"
                      style={{ border: "1.5px solid rgba(139,0,0,0.15)" }}
                    />

                    {/* 四角裝飾柱 */}
                    {[
                      { top: "1%", left: "1%"   },
                      { top: "1%", right: "1%"  },
                      { bottom: "5%", left: "1%" },
                      { bottom: "5%", right: "1%" },
                    ].map((pos, i) => (
                      <div
                        key={i}
                        className="absolute w-4 h-4 rounded-sm"
                        style={{
                          ...pos,
                          background: "rgba(139,0,0,0.18)",
                          border: "1px solid rgba(139,0,0,0.3)",
                        }}
                      />
                    ))}

                    {/* 桌位 */}
                    {tables.map((table) => {
                      const num = parseInt(table.name.replace(/\D/g, "")) || 0;
                      const pos = FLOOR_POSITIONS[num];
                      if (!pos) return null;
                      const isSelected = selectedTable?.id === table.id;
                      const available = table.isAvailable;
                      return (
                        <button
                          key={table.id}
                          disabled={!available}
                          onClick={() => setSelectedTable(table)}
                          className="absolute flex flex-col items-center justify-center rounded-xl transition-all duration-200"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            width: "22%",
                            height: "14%",
                            background: !available
                              ? "rgba(80,80,80,0.18)"
                              : isSelected
                              ? "linear-gradient(135deg, #8B0000, #5C0000)"
                              : "rgba(255,255,255,0.88)",
                            border: `2px solid ${
                              !available
                                ? "rgba(0,0,0,0.12)"
                                : isSelected
                                ? "rgba(212,175,55,0.9)"
                                : "rgba(212,175,55,0.5)"
                            }`,
                            boxShadow: isSelected
                              ? "0 4px 14px rgba(139,0,0,0.4)"
                              : available
                              ? "0 2px 6px rgba(0,0,0,0.12)"
                              : "none",
                            cursor: !available ? "not-allowed" : "pointer",
                            transform: isSelected ? "scale(1.07)" : "scale(1)",
                          }}
                        >
                          <span
                            className="text-xs font-bold leading-tight"
                            style={{
                              color: !available
                                ? "rgba(0,0,0,0.28)"
                                : isSelected
                                ? "#D4AF37"
                                : "#8B0000",
                            }}
                          >
                            {table.name}
                          </span>
                          <span
                            className="text-[10px] leading-tight mt-0.5"
                            style={{
                              color: !available
                                ? "rgba(0,0,0,0.22)"
                                : isSelected
                                ? "rgba(212,175,55,0.85)"
                                : "rgba(139,0,0,0.5)",
                            }}
                          >
                            {!available ? "已訂" : `${table.capacity}人`}
                          </span>
                        </button>
                      );
                    })}

                    {/* 入口 */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pb-1"
                    >
                      <div
                        className="w-14 h-1.5 rounded-t"
                        style={{ background: "rgba(139,0,0,0.35)" }}
                      />
                      <span className="text-[10px] mt-0.5" style={{ color: "rgba(139,0,0,0.45)" }}>入口</span>
                    </div>
                  </div>

                  {/* 圖例 */}
                  <div className="flex items-center gap-4 mt-3 px-1 text-xs" style={{ color: "rgba(139,0,0,0.6)" }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-sm" style={{ background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(212,175,55,0.5)" }} />
                      空桌
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-sm" style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", border: "1.5px solid rgba(212,175,55,0.9)" }} />
                      已選擇
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-sm" style={{ background: "rgba(80,80,80,0.18)", border: "1.5px solid rgba(0,0,0,0.12)" }} />
                      已預約
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl shadow-sm p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}>
              <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#1A0500" }}>
                <Users className="w-4 h-4" style={{ color: "#8B0000" }} /> 人數
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                  style={{ background: "rgba(139,0,0,0.08)", color: "#8B0000" }}
                >
                  −
                </button>
                <span className="text-2xl font-bold w-8 text-center" style={{ color: "#1A0500" }}>{guestCount}</span>
                <button
                  onClick={() => setGuestCount(Math.min(selectedTable?.capacity ?? 4, guestCount + 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                  style={{ background: "rgba(139,0,0,0.08)", color: "#8B0000" }}
                >
                  +
                </button>
                <span className="text-sm" style={{ color: "rgba(139,0,0,0.5)" }}>人</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl h-12 font-medium flex items-center justify-center gap-1 transition-colors"
                onClick={() => setStep("datetime")}
                style={{ background: "white", color: "#8B0000", border: "1px solid rgba(139,0,0,0.2)" }}
              >
                <ChevronLeft className="w-4 h-4" /> 上一步
              </button>
              <button
                className="flex-1 rounded-xl h-12 font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40"
                disabled={!selectedTable}
                onClick={() => setStep("confirm")}
                style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
              >
                下一步：確認 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <>
            <div className="rounded-2xl shadow-sm p-5 space-y-4" style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="flex items-center gap-3 mb-1">
                {/* 裝飾性牌牌 */}
                <div
                  className="w-7 h-9 rounded-sm flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: "linear-gradient(150deg, #fff, #f5f0e6)",
                    border: "1.5px solid #1B4D1B",
                    color: "#8B0000",
                    boxShadow: "1px 2px 4px rgba(0,0,0,0.18)",
                    fontFamily: "serif",
                  }}
                >
                  中
                </div>
                <h2 className="font-semibold tracking-wide" style={{ color: "#1A0500" }}>確認預約資訊</h2>
              </div>

              <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(212,175,55,0.15)" }}>
                {[
                  { label: "日期", value: selectedDate },
                  { label: "時段", value: `${selectedSlot?.name} (${selectedSlot?.startTime}~${selectedSlot?.endTime})` },
                  { label: "桌位", value: selectedTable?.name },
                  { label: "人數", value: `${guestCount} 人` },
                  { label: "費用", value: `NT$ ${selectedSlot?.price}` },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid rgba(212,175,55,0.12)",
                      background: i % 2 === 0 ? "white" : "#FDF6E3",
                    }}
                  >
                    <span className="text-sm" style={{ color: "rgba(139,0,0,0.6)" }}>{label}</span>
                    <span className="text-sm font-semibold" style={{ color: "#1A0500" }}>{value}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm mb-1.5 block" style={{ color: "rgba(139,0,0,0.65)" }}>備註（選填）</label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="特殊需求或備註..."
                  className="rounded-xl resize-none focus:outline-none"
                  style={{ border: "1px solid rgba(212,175,55,0.3)", background: "#FDF6E3" }}
                  rows={3}
                />
              </div>
            </div>

            <div
              className="rounded-xl p-4 text-sm flex items-start gap-3"
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)" }}
            >
              <div
                className="w-7 h-9 rounded-sm flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5"
                style={{
                  background: "linear-gradient(150deg, #2D7A2D, #1B4D1B)",
                  border: "1px solid rgba(45,122,45,0.5)",
                  color: "#D4AF37",
                  boxShadow: "1px 2px 3px rgba(0,0,0,0.2)",
                  fontFamily: "serif",
                }}
              >
                發
              </div>
              <p style={{ color: "#854D0E" }}>
                預約成功後將透過 LINE 傳送確認通知，請準時到場入座。
              </p>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl h-12 font-medium flex items-center justify-center gap-1"
                onClick={() => setStep("table")}
                style={{ background: "white", color: "#8B0000", border: "1px solid rgba(139,0,0,0.2)" }}
              >
                <ChevronLeft className="w-4 h-4" /> 上一步
              </button>
              <button
                className="flex-1 rounded-xl h-12 font-semibold flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
              >
                {submitting ? "預約中..." : "確認預約"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
