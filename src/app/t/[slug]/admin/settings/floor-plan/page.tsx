"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Save, Edit2, Check, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Table {
  id: string;
  name: string;
  capacity: number;
  posX: number;
  posY: number;
  tableWidth: number;
  tableHeight: number;
  isActive: boolean;
}

interface Floor {
  id: string;
  name: string;
  order: number;
  tables: Table[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BG_STYLE = {
  background: "linear-gradient(160deg, #D4A853 0%, #C8983E 40%, #D4A853 100%)",
  border: "3px solid rgba(139,0,0,0.25)",
  boxShadow: "inset 0 0 40px rgba(0,0,0,0.1), 0 2px 12px rgba(0,0,0,0.15)",
};

const GRID_PATTERN = `
  repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.04) 0px,
    rgba(0,0,0,0.04) 1px,
    transparent 1px,
    transparent 20px
  )
`;

const CORNER_POSITIONS = [
  { top: "1%", left: "1%" },
  { top: "1%", right: "1%" },
  { bottom: "5%", left: "1%" },
  { bottom: "5%", right: "1%" },
] as const;

// Clamp helper
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Add-table modal
// ---------------------------------------------------------------------------
interface AddTableModalProps {
  onConfirm: (name: string, capacity: number) => void;
  onClose: () => void;
}

function AddTableModal({ onConfirm, onClose }: AddTableModalProps) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("請輸入桌位名稱");
      return;
    }
    onConfirm(name.trim(), capacity);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-2xl shadow-xl p-6 w-full max-w-xs"
        style={{ background: "#FDF6E3", border: "1px solid rgba(212,175,55,0.35)" }}
      >
        <h3 className="font-bold text-base mb-4" style={{ color: "#1A0500" }}>
          新增桌位
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: "rgba(139,0,0,0.7)" }}>
              桌位名稱
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：桌1、包廂A"
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{
                border: "1px solid rgba(212,175,55,0.4)",
                background: "white",
                color: "#1A0500",
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: "rgba(139,0,0,0.7)" }}>
              容納人數
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{
                border: "1px solid rgba(212,175,55,0.4)",
                background: "white",
                color: "#1A0500",
              }}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl h-10 text-sm font-medium"
              style={{
                background: "white",
                color: "#8B0000",
                border: "1px solid rgba(139,0,0,0.2)",
              }}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl h-10 text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
            >
              <Plus className="w-4 h-4" /> 新增
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function FloorPlanEditorPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rename state
  const [renamingFloorId, setRenamingFloorId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Add table modal
  const [showAddTable, setShowAddTable] = useState(false);

  // Properties panel edit state
  const [propName, setPropName] = useState("");
  const [propCapacity, setPropCapacity] = useState(4);
  const [propX, setPropX] = useState(0);
  const [propY, setPropY] = useState(0);
  const [propSaving, setPropSaving] = useState(false);

  // Confirm delete table
  const [confirmDeleteTable, setConfirmDeleteTable] = useState(false);

  // Canvas ref for drag calculations
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag state stored in a ref to avoid re-renders during drag
  const dragRef = useRef<{
    active: boolean;
    tableId: string;
    startPointerX: number;
    startPointerY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const activeFloor = floors.find((f) => f.id === activeFloorId) ?? null;
  const selectedTable = activeFloor?.tables.find((t) => t.id === selectedTableId) ?? null;

  // ---------------------------------------------------------------------------
  // Load floors
  // ---------------------------------------------------------------------------
  const loadFloors = useCallback(async () => {
    try {
      const res = await fetch(`/api/t/${slug}/floors`);
      if (!res.ok) throw new Error("載入失敗");
      const data: Floor[] = await res.json();
      setFloors(data);
      if (data.length > 0) {
        setActiveFloorId((prev) => {
          // Keep current floor if it still exists, otherwise pick first
          if (prev && data.some((f) => f.id === prev)) return prev;
          return data[0].id;
        });
      }
    } catch {
      toast.error("無法載入樓層資料");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadFloors();
  }, [loadFloors]);

  // Sync properties panel when selected table changes
  useEffect(() => {
    if (selectedTable) {
      setPropName(selectedTable.name);
      setPropCapacity(selectedTable.capacity);
      setPropX(selectedTable.posX);
      setPropY(selectedTable.posY);
      setConfirmDeleteTable(false);
    }
  }, [selectedTable]);

  // Deselect table when switching floors
  useEffect(() => {
    setSelectedTableId(null);
    setConfirmDeleteTable(false);
  }, [activeFloorId]);

  // ---------------------------------------------------------------------------
  // Floor management
  // ---------------------------------------------------------------------------
  async function handleAddFloor() {
    const name = `${floors.length + 1}F`;
    try {
      const res = await fetch(`/api/t/${slug}/floors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, order: floors.length }),
      });
      if (!res.ok) throw new Error();
      const newFloor: Floor = await res.json();
      setFloors((prev) => [...prev, { ...newFloor, tables: [] }]);
      setActiveFloorId(newFloor.id);
      toast.success(`已新增樓層 ${name}`);
    } catch {
      toast.error("新增樓層失敗");
    }
  }

  function startRenameFloor(floor: Floor) {
    setRenamingFloorId(floor.id);
    setRenameValue(floor.name);
  }

  async function commitRenameFloor(floorId: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingFloorId(null);
      return;
    }
    try {
      const res = await fetch(`/api/t/${slug}/floors/${floorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      setFloors((prev) =>
        prev.map((f) => (f.id === floorId ? { ...f, name: trimmed } : f))
      );
      toast.success("樓層名稱已更新");
    } catch {
      toast.error("重新命名失敗");
    } finally {
      setRenamingFloorId(null);
    }
  }

  async function handleDeleteFloor(floorId: string) {
    if (!window.confirm("確定刪除此樓層？樓層內所有桌位也會一併刪除。")) return;
    try {
      const res = await fetch(`/api/t/${slug}/floors/${floorId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const updated = floors.filter((f) => f.id !== floorId);
      setFloors(updated);
      if (activeFloorId === floorId) {
        setActiveFloorId(updated[0]?.id ?? null);
      }
      toast.success("樓層已刪除");
    } catch {
      toast.error("刪除樓層失敗");
    }
  }

  // ---------------------------------------------------------------------------
  // Table management
  // ---------------------------------------------------------------------------
  async function handleAddTable(name: string, capacity: number) {
    if (!activeFloorId) return;
    setShowAddTable(false);
    try {
      const res = await fetch(`/api/t/${slug}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floorId: activeFloorId,
          name,
          capacity,
          posX: 39,
          posY: 40,
          tableWidth: 22,
          tableHeight: 14,
          order: activeFloor?.tables.length ?? 0,
        }),
      });
      if (!res.ok) throw new Error();
      const newTable: Table = await res.json();
      setFloors((prev) =>
        prev.map((f) =>
          f.id === activeFloorId ? { ...f, tables: [...f.tables, newTable] } : f
        )
      );
      setSelectedTableId(newTable.id);
      toast.success(`桌位「${name}」已新增`);
    } catch {
      toast.error("新增桌位失敗");
    }
  }

  async function handleSaveProps() {
    if (!selectedTable) return;
    setPropSaving(true);
    try {
      const res = await fetch(`/api/t/${slug}/tables/${selectedTable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: propName.trim(),
          capacity: propCapacity,
          posX: propX,
          posY: propY,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Table = await res.json();
      setFloors((prev) =>
        prev.map((f) =>
          f.id === activeFloorId
            ? { ...f, tables: f.tables.map((t) => (t.id === updated.id ? updated : t)) }
            : f
        )
      );
      toast.success("桌位資料已儲存");
    } catch {
      toast.error("儲存失敗");
    } finally {
      setPropSaving(false);
    }
  }

  async function handleDeleteTable() {
    if (!selectedTable) return;
    try {
      const res = await fetch(`/api/t/${slug}/tables/${selectedTable.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setFloors((prev) =>
        prev.map((f) =>
          f.id === activeFloorId
            ? { ...f, tables: f.tables.filter((t) => t.id !== selectedTable.id) }
            : f
        )
      );
      setSelectedTableId(null);
      setConfirmDeleteTable(false);
      toast.success("桌位已刪除");
    } catch {
      toast.error("刪除失敗");
    }
  }

  // ---------------------------------------------------------------------------
  // Drag logic (pointer events, ref-based, no re-render during drag)
  // ---------------------------------------------------------------------------
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, table: Table) {
    e.preventDefault();
    e.stopPropagation();

    // Select the table on click/drag start
    setSelectedTableId(table.id);

    const canvas = canvasRef.current;
    if (!canvas) return;

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      active: true,
      tableId: table.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startPosX: table.posX,
      startPosY: table.posY,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>, table: Table) {
    const drag = dragRef.current;
    if (!drag || !drag.active || drag.tableId !== table.id) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dxPx = e.clientX - drag.startPointerX;
    const dyPx = e.clientY - drag.startPointerY;
    const dxPct = (dxPx / rect.width) * 100;
    const dyPct = (dyPx / rect.height) * 100;

    const newX = clamp(drag.startPosX + dxPct, 0, 78);
    const newY = clamp(drag.startPosY + dyPct, 0, 86);

    // Update DOM directly for smooth drag (no React state during move)
    const el = e.currentTarget as HTMLDivElement;
    el.style.left = `${newX}%`;
    el.style.top = `${newY}%`;
  }

  async function handlePointerUp(e: React.PointerEvent<HTMLDivElement>, table: Table) {
    const drag = dragRef.current;
    if (!drag || !drag.active || drag.tableId !== table.id) return;

    const canvas = canvasRef.current;
    dragRef.current = null;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dxPx = e.clientX - drag.startPointerX;
    const dyPx = e.clientY - drag.startPointerY;
    const dxPct = (dxPx / rect.width) * 100;
    const dyPct = (dyPx / rect.height) * 100;

    const newX = clamp(Math.round(drag.startPosX + dxPct), 0, 78);
    const newY = clamp(Math.round(drag.startPosY + dyPct), 0, 86);

    // Skip save if position hasn't changed meaningfully
    if (newX === table.posX && newY === table.posY) return;

    // Optimistically update React state
    setFloors((prev) =>
      prev.map((f) =>
        f.id === activeFloorId
          ? {
              ...f,
              tables: f.tables.map((t) =>
                t.id === table.id ? { ...t, posX: newX, posY: newY } : t
              ),
            }
          : f
      )
    );

    // Sync X/Y in properties panel if this table is selected
    if (selectedTableId === table.id) {
      setPropX(newX);
      setPropY(newY);
    }

    // Persist to server
    try {
      const res = await fetch(`/api/t/${slug}/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posX: newX, posY: newY }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("位置儲存失敗，請重試");
      // Revert
      setFloors((prev) =>
        prev.map((f) =>
          f.id === activeFloorId
            ? {
                ...f,
                tables: f.tables.map((t) =>
                  t.id === table.id
                    ? { ...t, posX: drag.startPosX, posY: drag.startPosY }
                    : t
                ),
              }
            : f
        )
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        style={{ color: "rgba(139,0,0,0.5)" }}
      >
        <div className="text-center space-y-3">
          <div
            className="w-12 h-16 mx-auto rounded-md flex items-center justify-center font-bold text-2xl"
            style={{
              background: "linear-gradient(150deg, #fff, #f5f0e6)",
              border: "2px solid #1B4D1B",
              color: "#8B0000",
              fontFamily: "serif",
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          >
            中
          </div>
          <p className="text-sm">載入樓層中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#1A0500" }}>
            平面圖編輯
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(139,0,0,0.55)" }}>
            拖曳桌位調整位置，點選桌位可編輯詳細資訊
          </p>
        </div>
      </div>

      {/* Floor tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {floors.map((floor) => {
          const isActive = floor.id === activeFloorId;
          const isRenaming = renamingFloorId === floor.id;

          return (
            <div
              key={floor.id}
              className="flex items-center gap-1 rounded-xl px-1 py-1 transition-all"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, #8B0000, #5C0000)"
                  : "white",
                border: `1px solid ${isActive ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.25)"}`,
                boxShadow: isActive ? "0 2px 8px rgba(139,0,0,0.25)" : "none",
              }}
            >
              {isRenaming ? (
                <div className="flex items-center gap-1 px-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRenameFloor(floor.id);
                      if (e.key === "Escape") setRenamingFloorId(null);
                    }}
                    className="w-16 text-sm font-semibold focus:outline-none rounded px-1"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: isActive ? "#D4AF37" : "#1A0500",
                      border: "1px solid rgba(212,175,55,0.5)",
                    }}
                  />
                  <button
                    onClick={() => commitRenameFloor(floor.id)}
                    className="p-0.5 rounded"
                    style={{ color: isActive ? "#D4AF37" : "#8B0000" }}
                    title="確認"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setRenamingFloorId(null)}
                    className="p-0.5 rounded"
                    style={{ color: isActive ? "rgba(212,175,55,0.6)" : "rgba(139,0,0,0.5)" }}
                    title="取消"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setActiveFloorId(floor.id)}
                    onDoubleClick={() => startRenameFloor(floor)}
                    className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors"
                    style={{ color: isActive ? "#D4AF37" : "rgba(139,0,0,0.7)" }}
                    title="雙擊重新命名"
                  >
                    {floor.name}
                  </button>
                  <button
                    onClick={() => startRenameFloor(floor)}
                    className="p-1 rounded transition-opacity opacity-0 hover:opacity-100"
                    style={{ color: isActive ? "rgba(212,175,55,0.7)" : "rgba(139,0,0,0.4)" }}
                    title="重新命名"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {floors.length > 1 && (
                    <button
                      onClick={() => handleDeleteFloor(floor.id)}
                      className="p-1 rounded transition-opacity opacity-60 hover:opacity-100"
                      style={{ color: isActive ? "rgba(212,175,55,0.7)" : "rgba(139,0,0,0.4)" }}
                      title="刪除此樓層"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Add floor button */}
        <button
          onClick={handleAddFloor}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:opacity-80"
          style={{
            background: "rgba(212,175,55,0.12)",
            color: "#8B0000",
            border: "1px dashed rgba(212,175,55,0.5)",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          新增樓層
        </button>
      </div>

      {/* No floors state */}
      {floors.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "white", border: "2px dashed rgba(212,175,55,0.3)" }}
        >
          <p className="text-base font-medium mb-1" style={{ color: "#8B0000" }}>
            尚未設定任何樓層
          </p>
          <p className="text-sm mb-4" style={{ color: "rgba(139,0,0,0.5)" }}>
            點擊「新增樓層」開始建立平面圖
          </p>
        </div>
      )}

      {/* Editor: canvas + properties */}
      {activeFloor && (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* ---------------------------------------------------------------- */}
          {/* Left: Canvas                                                      */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Add table button */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "rgba(139,0,0,0.65)" }}>
                {activeFloor.name} · {activeFloor.tables.length} 個桌位
              </p>
              <button
                onClick={() => setShowAddTable(true)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
              >
                <Plus className="w-4 h-4" />
                新增桌位
              </button>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              className="relative w-full rounded-2xl overflow-hidden select-none"
              style={{ aspectRatio: "4 / 5", ...BG_STYLE }}
              onClick={() => setSelectedTableId(null)}
            >
              {/* Wood floor grid */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: GRID_PATTERN }}
              />

              {/* Inner border */}
              <div
                className="absolute inset-2 pointer-events-none rounded-lg"
                style={{ border: "1.5px solid rgba(139,0,0,0.15)" }}
              />

              {/* Corner pillars */}
              {CORNER_POSITIONS.map((pos, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 rounded-sm pointer-events-none"
                  style={{
                    ...pos,
                    background: "rgba(139,0,0,0.18)",
                    border: "1px solid rgba(139,0,0,0.3)",
                  }}
                />
              ))}

              {/* Tables */}
              {activeFloor.tables.map((table) => {
                const isSelected = selectedTableId === table.id;
                return (
                  <div
                    key={table.id}
                    className="absolute flex flex-col items-center justify-center rounded-xl cursor-grab active:cursor-grabbing"
                    style={{
                      left: `${table.posX}%`,
                      top: `${table.posY}%`,
                      width: `${table.tableWidth}%`,
                      height: `${table.tableHeight}%`,
                      background: isSelected
                        ? "linear-gradient(135deg, #8B0000, #5C0000)"
                        : "rgba(255,255,255,0.88)",
                      border: `2px solid ${
                        isSelected ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.5)"
                      }`,
                      boxShadow: isSelected
                        ? "0 4px 14px rgba(139,0,0,0.4), 0 0 0 2px rgba(212,175,55,0.3)"
                        : "0 2px 6px rgba(0,0,0,0.12)",
                      transform: isSelected ? "scale(1.07)" : "scale(1)",
                      transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s, transform 0.1s",
                      touchAction: "none",
                      zIndex: isSelected ? 10 : 1,
                    }}
                    onPointerDown={(e) => handlePointerDown(e, table)}
                    onPointerMove={(e) => handlePointerMove(e, table)}
                    onPointerUp={(e) => handlePointerUp(e, table)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTableId(table.id);
                    }}
                  >
                    <span
                      className="text-xs font-bold leading-tight"
                      style={{ color: isSelected ? "#D4AF37" : "#8B0000" }}
                    >
                      {table.name}
                    </span>
                    <span
                      className="text-[10px] leading-tight mt-0.5"
                      style={{
                        color: isSelected ? "rgba(212,175,55,0.85)" : "rgba(139,0,0,0.5)",
                      }}
                    >
                      {table.capacity}人
                    </span>
                  </div>
                );
              })}

              {/* Empty state overlay */}
              {activeFloor.tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="rounded-2xl px-6 py-4 text-center"
                    style={{ background: "rgba(253,246,227,0.85)" }}
                  >
                    <p className="text-sm font-medium" style={{ color: "rgba(139,0,0,0.7)" }}>
                      點擊「新增桌位」加入桌位
                    </p>
                  </div>
                </div>
              )}

              {/* Entrance indicator */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pb-1">
                <div
                  className="w-14 h-1.5 rounded-t"
                  style={{ background: "rgba(139,0,0,0.35)" }}
                />
                <span
                  className="text-[10px] mt-0.5"
                  style={{ color: "rgba(139,0,0,0.45)" }}
                >
                  入口
                </span>
              </div>
            </div>

            {/* Legend */}
            <div
              className="flex items-center gap-4 px-1 text-xs"
              style={{ color: "rgba(139,0,0,0.6)" }}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded-sm"
                  style={{
                    background: "rgba(255,255,255,0.88)",
                    border: "1.5px solid rgba(212,175,55,0.5)",
                  }}
                />
                一般桌位
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded-sm"
                  style={{
                    background: "linear-gradient(135deg, #8B0000, #5C0000)",
                    border: "1.5px solid rgba(212,175,55,0.9)",
                  }}
                />
                已選取
              </div>
              <div className="flex items-center gap-1.5 ml-auto opacity-70">
                拖曳桌位可調整位置
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Right: Properties panel                                           */}
          {/* ---------------------------------------------------------------- */}
          <div
            className="lg:w-72 flex-shrink-0 rounded-2xl shadow-sm overflow-hidden"
            style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}
          >
            {/* Panel header */}
            <div
              className="px-5 py-4"
              style={{
                background: "linear-gradient(135deg, #8B0000, #5C0000)",
                borderBottom: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              <h2 className="font-semibold text-sm tracking-wide" style={{ color: "#D4AF37" }}>
                {selectedTable ? `桌位屬性` : "屬性面板"}
              </h2>
              {selectedTable && (
                <p className="text-xs mt-0.5" style={{ color: "rgba(212,175,55,0.65)" }}>
                  {selectedTable.name}
                </p>
              )}
            </div>

            <div className="p-5">
              {!selectedTable ? (
                /* No selection */
                <div className="py-8 text-center space-y-3">
                  <div
                    className="w-10 h-10 rounded-full mx-auto flex items-center justify-center"
                    style={{ background: "rgba(212,175,55,0.1)" }}
                  >
                    <Edit2 className="w-5 h-5" style={{ color: "rgba(212,175,55,0.6)" }} />
                  </div>
                  <p className="text-sm" style={{ color: "rgba(139,0,0,0.5)" }}>
                    點選桌位進行編輯
                  </p>
                  <p className="text-xs" style={{ color: "rgba(139,0,0,0.35)" }}>
                    或拖曳桌位調整位置
                  </p>
                </div>
              ) : (
                /* Table properties */
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "rgba(139,0,0,0.65)" }}
                    >
                      桌位名稱
                    </label>
                    <input
                      type="text"
                      value={propName}
                      onChange={(e) => setPropName(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                      style={{
                        border: "1px solid rgba(212,175,55,0.35)",
                        background: "#FDF6E3",
                        color: "#1A0500",
                      }}
                    />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "rgba(139,0,0,0.65)" }}
                    >
                      容納人數
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={propCapacity}
                      onChange={(e) => setPropCapacity(Number(e.target.value))}
                      className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                      style={{
                        border: "1px solid rgba(212,175,55,0.35)",
                        background: "#FDF6E3",
                        color: "#1A0500",
                      }}
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "rgba(139,0,0,0.65)" }}
                    >
                      位置（%）
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span
                          className="block text-[10px] mb-1"
                          style={{ color: "rgba(139,0,0,0.45)" }}
                        >
                          X 軸 (0–78)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={78}
                          value={propX}
                          onChange={async (e) => {
                            const val = clamp(Number(e.target.value), 0, 78);
                            setPropX(val);
                            // Optimistic update
                            setFloors((prev) =>
                              prev.map((f) =>
                                f.id === activeFloorId
                                  ? {
                                      ...f,
                                      tables: f.tables.map((t) =>
                                        t.id === selectedTable.id ? { ...t, posX: val } : t
                                      ),
                                    }
                                  : f
                              )
                            );
                          }}
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                          style={{
                            border: "1px solid rgba(212,175,55,0.35)",
                            background: "#FDF6E3",
                            color: "#1A0500",
                          }}
                        />
                      </div>
                      <div>
                        <span
                          className="block text-[10px] mb-1"
                          style={{ color: "rgba(139,0,0,0.45)" }}
                        >
                          Y 軸 (0–86)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={86}
                          value={propY}
                          onChange={async (e) => {
                            const val = clamp(Number(e.target.value), 0, 86);
                            setPropY(val);
                            // Optimistic update
                            setFloors((prev) =>
                              prev.map((f) =>
                                f.id === activeFloorId
                                  ? {
                                      ...f,
                                      tables: f.tables.map((t) =>
                                        t.id === selectedTable.id ? { ...t, posY: val } : t
                                      ),
                                    }
                                  : f
                              )
                            );
                          }}
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                          style={{
                            border: "1px solid rgba(212,175,55,0.35)",
                            background: "#FDF6E3",
                            color: "#1A0500",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid rgba(212,175,55,0.15)" }} />

                  {/* Save button */}
                  <button
                    onClick={handleSaveProps}
                    disabled={propSaving}
                    className="w-full rounded-xl h-10 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
                  >
                    {propSaving ? (
                      "儲存中..."
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> 儲存
                      </>
                    )}
                  </button>

                  {/* Delete button */}
                  {!confirmDeleteTable ? (
                    <button
                      onClick={() => setConfirmDeleteTable(true)}
                      className="w-full rounded-xl h-10 text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        color: "#DC2626",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> 刪除此桌位
                    </button>
                  ) : (
                    <div
                      className="rounded-xl p-3 space-y-2"
                      style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <p className="text-xs text-center font-medium" style={{ color: "#DC2626" }}>
                        確定要刪除「{selectedTable.name}」？
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDeleteTable(false)}
                          className="flex-1 rounded-lg h-8 text-xs font-medium"
                          style={{
                            background: "white",
                            color: "#6B7280",
                            border: "1px solid #E5E7EB",
                          }}
                        >
                          取消
                        </button>
                        <button
                          onClick={handleDeleteTable}
                          className="flex-1 rounded-lg h-8 text-xs font-semibold flex items-center justify-center gap-1"
                          style={{ background: "#DC2626", color: "white" }}
                        >
                          <Trash2 className="w-3 h-3" /> 確認刪除
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Table ID (small hint) */}
                  <p className="text-[10px] text-center" style={{ color: "rgba(139,0,0,0.25)" }}>
                    ID: {selectedTable.id.slice(0, 8)}…
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add table modal */}
      {showAddTable && (
        <AddTableModal
          onConfirm={handleAddTable}
          onClose={() => setShowAddTable(false)}
        />
      )}
    </div>
  );
}
