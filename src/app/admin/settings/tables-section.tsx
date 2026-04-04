"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface Table {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  floorId: string;
}

interface Floor {
  id: string;
  name: string;
  order: number;
  tables: Table[];
}

// Floor accent colors (cycling)
const FLOOR_COLORS = [
  { bg: "linear-gradient(135deg, #8B0000, #5C0000)", text: "#D4AF37", border: "#D4AF3730" },
  { bg: "linear-gradient(135deg, #1B4D1B, #0F3010)", text: "#D4AF37", border: "#D4AF3730" },
  { bg: "linear-gradient(135deg, #1A2A5E, #0F1A3D)", text: "#D4AF37", border: "#D4AF3730" },
  { bg: "linear-gradient(135deg, #5C3A00, #3D2500)", text: "#D4AF37", border: "#D4AF3730" },
  { bg: "linear-gradient(135deg, #4A0050, #300035)", text: "#D4AF37", border: "#D4AF3730" },
];

function FloorCard({ floor, colorIdx, onRefresh }: { floor: Floor; colorIdx: number; onRefresh: () => void }) {
  const router = useRouter();
  const color = FLOOR_COLORS[colorIdx % FLOOR_COLORS.length];

  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [addingTable, setAddingTable] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [floorNameDraft, setFloorNameDraft] = useState(floor.name);
  const [savingName, setSavingName] = useState(false);

  const [deletingFloor, setDeletingFloor] = useState(false);

  async function handleToggleTable(tableId: string, isActive: boolean) {
    await fetch("/api/tables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tableId, isActive: !isActive }),
    });
    router.refresh();
  }

  async function handleDeleteTable(tableId: string, tableName: string) {
    if (!confirm(`確定要刪除「${tableName}」嗎？`)) return;
    const res = await fetch(`/api/tables?id=${tableId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("桌位已刪除");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "刪除失敗");
    }
  }

  async function handleAddTable() {
    if (!newTableName.trim()) return;
    setAddingTable(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTableName.trim(),
          floorId: floor.id,
          capacity: newTableCapacity,
        }),
      });
      if (res.ok) {
        toast.success("桌位已新增");
        setNewTableName("");
        setNewTableCapacity(4);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "新增失敗");
      }
    } finally {
      setAddingTable(false);
    }
  }

  async function handleSaveFloorName() {
    if (!floorNameDraft.trim() || floorNameDraft === floor.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/floors/${floor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: floorNameDraft.trim() }),
      });
      if (res.ok) {
        toast.success("已更新空間名稱");
        setEditingName(false);
        router.refresh();
      }
    } finally {
      setSavingName(false);
    }
  }

  async function handleDeleteFloor() {
    if (floor.tables.length > 0) {
      toast.error("請先刪除此空間所有桌位再移除空間");
      return;
    }
    if (!confirm(`確定要刪除空間「${floor.name}」嗎？`)) return;
    setDeletingFloor(true);
    try {
      const res = await fetch(`/api/floors/${floor.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("空間已刪除");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "刪除失敗");
      }
    } finally {
      setDeletingFloor(false);
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ border: "1px solid #D4AF3720" }}
    >
      {/* Floor header */}
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ background: color.bg, borderBottom: `1px solid ${color.border}` }}
      >
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={floorNameDraft}
              onChange={(e) => setFloorNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveFloorName(); if (e.key === "Escape") setEditingName(false); }}
              className="flex-1 text-sm font-semibold px-2 py-0.5 rounded-md outline-none"
              style={{ background: "rgba(255,255,255,0.15)", color: color.text, border: "1px solid rgba(212,175,55,0.4)" }}
            />
            <button onClick={handleSaveFloorName} disabled={savingName} style={{ color: color.text }}>
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditingName(false); setFloorNameDraft(floor.name); }} style={{ color: "rgba(212,175,55,0.6)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="font-semibold text-sm flex-1" style={{ color: color.text }}>
              {floor.name}
            </span>
            <span className="text-xs" style={{ color: "rgba(212,175,55,0.5)" }}>
              {floor.tables.length} 桌
            </span>
            <button
              onClick={() => setEditingName(true)}
              className="p-1 rounded-md transition-opacity hover:opacity-70"
              style={{ color: "rgba(212,175,55,0.6)" }}
              title="重新命名"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteFloor}
              disabled={deletingFloor}
              className="p-1 rounded-md transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ color: "rgba(212,175,55,0.5)" }}
              title={floor.tables.length > 0 ? "請先刪除所有桌位" : "刪除此空間"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Tables */}
      <div className="p-4 space-y-3" style={{ background: "#FAFAF7" }}>
        {floor.tables.length === 0 ? (
          <p className="text-xs text-center py-2" style={{ color: "rgba(139,0,0,0.3)" }}>
            尚無桌位，請在下方新增
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {floor.tables.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 group"
                style={{
                  background: "white",
                  border: `1px solid ${t.isActive ? "#D4AF3725" : "#E5E7EB"}`,
                  opacity: t.isActive ? 1 : 0.65,
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#1A0500" }}>{t.name}</p>
                  <p className="text-[11px]" style={{ color: "rgba(139,0,0,0.4)" }}>最多 {t.capacity} 人</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleTable(t.id, t.isActive)}
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors"
                    style={
                      t.isActive
                        ? { background: "#DCFCE7", color: "#166534" }
                        : { background: "#F3F4F6", color: "#6B7280" }
                    }
                  >
                    {t.isActive ? "啟用" : "停用"}
                  </button>
                  <button
                    onClick={() => handleDeleteTable(t.id, t.name)}
                    className="text-[11px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#FEE2E2", color: "#991B1B" }}
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add table */}
        <div
          className="flex gap-2 pt-1 border-t"
          style={{ borderColor: "#D4AF3715" }}
        >
          <input
            type="text"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
            placeholder="新桌位名稱（如：包廂1）"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "white", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
          />
          <div className="flex items-center gap-1.5">
            <select
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(Number(e.target.value))}
              className="px-2 py-2 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
            >
              {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n}>{n}人</option>
              ))}
            </select>
            <button
              onClick={handleAddTable}
              disabled={addingTable || !newTableName.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: color.bg, color: color.text }}
            >
              <Plus className="w-3.5 h-3.5" />
              新增
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TablesSection({ floors }: { floors: Floor[] }) {
  const router = useRouter();
  const [newFloorName, setNewFloorName] = useState("");
  const [addingFloor, setAddingFloor] = useState(false);

  async function handleAddFloor() {
    if (!newFloorName.trim()) return;
    setAddingFloor(true);
    try {
      const res = await fetch("/api/floors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFloorName.trim() }),
      });
      if (res.ok) {
        toast.success(`空間「${newFloorName.trim()}」已新增`);
        setNewFloorName("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "新增失敗");
      }
    } finally {
      setAddingFloor(false);
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ border: "1px solid #D4AF3720", background: "white" }}
    >
      {/* Section header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid #D4AF3715" }}
      >
        <div>
          <h2 className="font-semibold" style={{ color: "#1A0500" }}>桌位管理</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(139,0,0,0.5)" }}>
            依空間分類管理桌位（大廳、包廂、獨立室等）
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: "rgba(212,175,55,0.12)", color: "#854D0E" }}
        >
          {floors.reduce((acc, f) => acc + f.tables.length, 0)} 桌 · {floors.length} 空間
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Floor cards */}
        {floors.length === 0 ? (
          <div
            className="rounded-2xl text-center py-10"
            style={{ background: "#FDF6E3", border: "1px dashed rgba(212,175,55,0.4)" }}
          >
            <p className="text-sm font-medium" style={{ color: "rgba(139,0,0,0.5)" }}>尚未建立任何空間</p>
            <p className="text-xs mt-1" style={{ color: "rgba(139,0,0,0.35)" }}>
              請在下方新增第一個空間（如：大廳）
            </p>
          </div>
        ) : (
          floors.map((floor, i) => (
            <FloorCard key={floor.id} floor={floor} colorIdx={i} onRefresh={() => router.refresh()} />
          ))
        )}

        {/* Add floor */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#FDF6E3", border: "1px dashed rgba(212,175,55,0.4)" }}
        >
          <p className="text-xs font-semibold mb-2.5 tracking-wide" style={{ color: "rgba(139,0,0,0.6)" }}>
            新增空間
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFloor()}
              placeholder="空間名稱（如：大廳、包廂A、獨立包廂）"
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid rgba(212,175,55,0.3)", color: "#1A0500" }}
            />
            <button
              onClick={handleAddFloor}
              disabled={addingFloor || !newFloorName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
            >
              <Plus className="w-4 h-4" /> 新增空間
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
