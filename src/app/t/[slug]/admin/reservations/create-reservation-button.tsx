"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronRight, ChevronLeft, Search, UserPlus, X } from "lucide-react";

type TimeSlot = { id: string; name: string; startTime: string; endTime: string; price: number };
type Member = { id: string; displayName: string; phone: string | null; pictureUrl: string | null };
type Table = { id: string; name: string; capacity: number; isAvailable?: boolean };

const TODAY = new Date().toISOString().split("T")[0];

const inputStyle = {
  background: "#FDF6E3",
  border: "1px solid rgba(212,175,55,0.3)",
  color: "#1A0500",
};

export default function CreateReservationButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // step 1 state
  const [date, setDate] = useState(TODAY);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // step 2 state
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearched, setMemberSearched] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  // step 3 state
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // step 4 state
  const [guestCount, setGuestCount] = useState(1);
  const [note, setNote] = useState("");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始載入時段
  useEffect(() => {
    if (!open) return;
    fetch(`/api/t/${slug}/timeslots`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: TimeSlot[]) => {
        setTimeSlots(data);
        if (data.length > 0) setSelectedSlot(data[0]);
      })
      .catch(() => {});
  }, [open, slug]);

  // 搜尋會員（debounce）
  useEffect(() => {
    if (!memberSearch.trim()) {
      setMemberResults([]);
      setMemberSearched(false);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/t/${slug}/members?search=${encodeURIComponent(memberSearch)}&page=1`);
      if (res.ok) {
        const data = await res.json();
        setMemberResults(data.users ?? []);
        setMemberSearched(true);
      }
    }, 300);
  }, [memberSearch, slug]);

  // 進入 step 3 時載入桌位可用性
  useEffect(() => {
    if (step !== 3 || !selectedSlot) return;
    fetch(`/api/t/${slug}/tables?date=${date}&timeSlotId=${selectedSlot.id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Table[]) => setTables(data))
      .catch(() => setTables([]));
  }, [step, slug, date, selectedSlot]);

  function reset() {
    setStep(1);
    setDate(TODAY);
    setSelectedSlot(timeSlots[0] ?? null);
    setMemberSearch("");
    setMemberResults([]);
    setSelectedMember(null);
    setMemberSearched(false);
    setCreatingMember(false);
    setNewMemberName("");
    setNewMemberPhone("");
    setTables([]);
    setSelectedTable(null);
    setGuestCount(1);
    setNote("");
    setError("");
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function handleCreateMember() {
    if (!newMemberName.trim()) { setError("姓名不得為空"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/t/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: newMemberName.trim(), phone: newMemberPhone.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "建立失敗");
      }
      const member = await res.json();
      setSelectedMember(member);
      setCreatingMember(false);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedMember || !selectedTable || !selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/t/${slug}/admin/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMember.id,
          tableId: selectedTable.id,
          timeSlotId: selectedSlot.id,
          date,
          guestCount,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "建立失敗");
      }
      handleClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setLoading(false);
    }
  }

  const stepLabels = ["日期時段", "選擇會員", "選擇桌位", "確認送出"];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-85"
        style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
      >
        <CalendarPlus className="w-4 h-4" />
        新增預約
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white" }}>
            {/* 標題 + 步驟指示 */}
            <div style={{ background: "linear-gradient(135deg, #1A0500, #0D0200)", borderBottom: "1px solid #D4AF3725" }}>
              <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold" style={{ color: "#D4AF37" }}>新增預約</h2>
                <button onClick={handleClose} style={{ color: "rgba(212,175,55,0.5)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 pb-3 flex gap-1">
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const active = step === n;
                  return (
                    <div key={n} className="flex items-center gap-1 flex-1 min-w-0">
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: done ? "#D4AF37" : active ? "#8B0000" : "rgba(212,175,55,0.15)",
                          color: done || active ? "white" : "rgba(212,175,55,0.4)",
                        }}
                      >
                        {done ? "✓" : n}
                      </div>
                      <span className="text-[10px] truncate" style={{ color: active ? "#D4AF37" : "rgba(212,175,55,0.35)" }}>
                        {label}
                      </span>
                      {i < stepLabels.length - 1 && (
                        <div className="flex-1 h-px mx-1" style={{ background: "rgba(212,175,55,0.15)" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 內容 */}
            <div className="px-6 py-5 space-y-4" style={{ minHeight: 260 }}>

              {/* ── Step 1: 日期 + 時段 ── */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B4C2A" }}>預約日期</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B4C2A" }}>時段</label>
                    {timeSlots.length === 0 ? (
                      <p className="text-sm" style={{ color: "rgba(139,0,0,0.4)" }}>載入中…</p>
                    ) : (
                      <div className="space-y-2">
                        {timeSlots.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                            style={{
                              background: selectedSlot?.id === s.id ? "rgba(139,0,0,0.07)" : "#FDF6E3",
                              border: `1px solid ${selectedSlot?.id === s.id ? "rgba(139,0,0,0.3)" : "rgba(212,175,55,0.25)"}`,
                            }}
                          >
                            <input
                              type="radio"
                              name="slot"
                              checked={selectedSlot?.id === s.id}
                              onChange={() => setSelectedSlot(s)}
                              className="accent-red-800"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium" style={{ color: "#1A0500" }}>{s.name}</span>
                              <span className="text-xs ml-2" style={{ color: "rgba(139,0,0,0.45)" }}>
                                {s.startTime} – {s.endTime}
                              </span>
                            </div>
                            <span className="text-xs font-semibold" style={{ color: "#8B6914" }}>NT${s.price}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Step 2: 選擇會員 ── */}
              {step === 2 && !creatingMember && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B4C2A" }}>搜尋會員（姓名或電話）</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(139,0,0,0.35)" }} />
                      <input
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="輸入關鍵字搜尋…"
                        className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
                        style={inputStyle}
                        autoFocus
                      />
                    </div>
                  </div>

                  {memberResults.length > 0 && (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {memberResults.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedMember(m); setStep(3); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-amber-50"
                          style={{ border: "1px solid rgba(212,175,55,0.25)" }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{ background: "linear-gradient(135deg,#8B0000,#5C0000)", color: "#D4AF37" }}
                          >
                            {m.displayName.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "#1A0500" }}>{m.displayName}</p>
                            {m.phone && <p className="text-xs" style={{ color: "rgba(139,0,0,0.4)" }}>{m.phone}</p>}
                          </div>
                          <ChevronRight className="ml-auto w-4 h-4" style={{ color: "rgba(139,0,0,0.25)" }} />
                        </button>
                      ))}
                    </div>
                  )}

                  {memberSearched && memberResults.length === 0 && (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm" style={{ color: "rgba(139,0,0,0.4)" }}>查無符合的會員</p>
                      <button
                        onClick={() => { setCreatingMember(true); setError(""); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium mx-auto"
                        style={{ background: "linear-gradient(135deg,#8B0000,#6B0000)", color: "#D4AF37" }}
                      >
                        <UserPlus className="w-4 h-4" />
                        新增臨時會員
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── Step 2: 新增臨時會員表單 ── */}
              {step === 2 && creatingMember && (
                <>
                  <button
                    onClick={() => { setCreatingMember(false); setError(""); }}
                    className="flex items-center gap-1 text-xs mb-1"
                    style={{ color: "rgba(139,0,0,0.5)" }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> 返回搜尋
                  </button>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#6B4C2A" }}>
                      姓名 <span style={{ color: "#8B0000" }}>*</span>
                    </label>
                    <input
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="電話預約客戶姓名"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={inputStyle}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#6B4C2A" }}>電話</label>
                    <input
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      placeholder="選填"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {/* ── Step 3: 選擇桌位 ── */}
              {step === 3 && (
                <>
                  <div
                    className="px-3 py-2 rounded-xl text-xs flex items-center gap-2"
                    style={{ background: "#FDF6E3", border: "1px solid rgba(212,175,55,0.2)", color: "#6B4C2A" }}
                  >
                    <span className="font-medium" style={{ color: "#1A0500" }}>{selectedMember?.displayName}</span>
                    <span>·</span>
                    <span>{date}</span>
                    <span>·</span>
                    <span>{selectedSlot?.name}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B4C2A" }}>選擇桌位</label>
                    {tables.length === 0 ? (
                      <p className="text-sm" style={{ color: "rgba(139,0,0,0.4)" }}>載入中…</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {tables.map((t) => {
                          const active = selectedTable?.id === t.id;
                          const unavailable = t.isAvailable === false;
                          return (
                            <button
                              key={t.id}
                              onClick={() => { setSelectedTable(t); setGuestCount(Math.min(guestCount, t.capacity)); }}
                              className="px-3 py-2.5 rounded-xl text-left transition-colors"
                              style={{
                                background: active ? "rgba(139,0,0,0.08)" : unavailable ? "#F9F9F9" : "#FDF6E3",
                                border: `1px solid ${active ? "rgba(139,0,0,0.35)" : unavailable ? "#E5E7EB" : "rgba(212,175,55,0.25)"}`,
                                opacity: unavailable && !active ? 0.65 : 1,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium" style={{ color: unavailable ? "#9CA3AF" : "#1A0500" }}>
                                  {t.name}
                                </span>
                                {unavailable && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                                    已滿
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px]" style={{ color: "rgba(139,0,0,0.4)" }}>
                                容納 {t.capacity} 人
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Step 4: 人數 + 備註 ── */}
              {step === 4 && (
                <>
                  <div
                    className="px-3 py-2 rounded-xl text-xs space-y-0.5"
                    style={{ background: "#FDF6E3", border: "1px solid rgba(212,175,55,0.2)", color: "#6B4C2A" }}
                  >
                    <div className="flex gap-2">
                      <span className="font-medium" style={{ color: "#1A0500" }}>{selectedMember?.displayName}</span>
                      {selectedMember?.phone && <span style={{ color: "rgba(139,0,0,0.4)" }}>{selectedMember.phone}</span>}
                    </div>
                    <div className="flex gap-2">
                      <span>{date}</span>
                      <span>·</span>
                      <span>{selectedSlot?.name}</span>
                      <span>·</span>
                      <span>{selectedTable?.name}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#6B4C2A" }}>
                      人數（最多 {selectedTable?.capacity} 人）
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedTable?.capacity ?? 99}
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#6B4C2A" }}>備註</label>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="例如：電話預約、臨時訂位…"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                  {error}
                </p>
              )}
            </div>

            {/* 底部按鈕 */}
            <div className="px-6 pb-5 flex gap-3">
              {step > 1 && !(step === 2 && creatingMember) && (
                <button
                  onClick={() => { setStep((s) => s - 1); setError(""); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "#F3F4F6", color: "#374151" }}
                >
                  上一步
                </button>
              )}
              <div className="flex-1" />

              {/* Step 1 → 2 */}
              {step === 1 && (
                <button
                  onClick={() => { if (!selectedSlot) return; setStep(2); setError(""); }}
                  disabled={!selectedSlot || !date}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#8B0000,#6B0000)", color: "#D4AF37" }}
                >
                  下一步
                </button>
              )}

              {/* Step 2: 新增臨時會員確認 */}
              {step === 2 && creatingMember && (
                <button
                  onClick={handleCreateMember}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#8B0000,#6B0000)", color: "#D4AF37" }}
                >
                  {loading ? "建立中…" : "建立並繼續"}
                </button>
              )}

              {/* Step 3 → 4 */}
              {step === 3 && (
                <button
                  onClick={() => { if (!selectedTable) return; setStep(4); setError(""); }}
                  disabled={!selectedTable}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#8B0000,#6B0000)", color: "#D4AF37" }}
                >
                  下一步
                </button>
              )}

              {/* Step 4: 送出 */}
              {step === 4 && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#8B0000,#6B0000)", color: "#D4AF37" }}
                >
                  {loading ? "建立中…" : "確認建立"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
