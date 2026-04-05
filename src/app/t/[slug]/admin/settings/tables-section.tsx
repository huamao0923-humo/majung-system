"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Building2 } from "lucide-react";

interface Table {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  order: number;
}

interface Floor {
  id: string;
  name: string;
  order: number;
  tables: Table[];
}

interface Props {
  slug: string;
}

export default function TenantTablesSection({ slug }: Props) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New floor
  const [newFloorName, setNewFloorName] = useState("");
  const [addingFloor, setAddingFloor] = useState(false);
  const [showNewFloor, setShowNewFloor] = useState(false);

  // Edit floor name
  const [editFloorId, setEditFloorId] = useState<string | null>(null);
  const [editFloorName, setEditFloorName] = useState("");

  // New table
  const [newTableName, setNewTableName] = useState("");
  const [newTableCap, setNewTableCap] = useState(4);
  const [addingTable, setAddingTable] = useState(false);

  // Edit table
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const [editTableName, setEditTableName] = useState("");
  const [editTableCap, setEditTableCap] = useState(4);

  async function load() {
    const res = await fetch(`/api/t/${slug}/floors`);
    const data: Floor[] = await res.json();
    setFloors(data);
    setActiveFloorId((prev) => {
      if (prev && data.find((f) => f.id === prev)) return prev;
      return data[0]?.id ?? null;
    });
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const activeFloor = floors.find((f) => f.id === activeFloorId) ?? null;

  // --- Floor actions ---
  async function handleAddFloor() {
    if (!newFloorName.trim()) return;
    setAddingFloor(true);
    try {
      const res = await fetch(`/api/t/${slug}/floors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFloorName.trim(), order: floors.length }),
      });
      if (res.ok) {
        const floor: Floor = await res.json();
        toast.success("空間已新增");
        setNewFloorName("");
        setShowNewFloor(false);
        await load();
        setActiveFloorId(floor.id);
      }
    } finally {
      setAddingFloor(false);
    }
  }

  async function handleRenameFloor(id: string) {
    if (!editFloorName.trim()) return;
    const res = await fetch(`/api/t/${slug}/floors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editFloorName.trim() }),
    });
    if (res.ok) {
      toast.success("已更新名稱");
      setEditFloorId(null);
      load();
    }
  }

  async function handleDeleteFloor(id: string, name: string) {
    if (!confirm(`確定刪除「${name}」空間？底下所有桌位也會一併刪除。`)) return;
    const res = await fetch(`/api/t/${slug}/floors/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("空間已刪除");
      setActiveFloorId(null);
      load();
    }
  }

  // --- Table actions ---
  async function handleToggleTable(id: string, isActive: boolean) {
    await fetch(`/api/t/${slug}/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function handleAddTable() {
    if (!newTableName.trim() || !activeFloorId) return;
    setAddingTable(true);
    try {
      const res = await fetch(`/api/t/${slug}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floorId: activeFloorId,
          name: newTableName.trim(),
          capacity: newTableCap,
          order: activeFloor?.tables.length ?? 0,
        }),
      });
      if (res.ok) {
        toast.success("桌位已新增");
        setNewTableName("");
        setNewTableCap(4);
        load();
      }
    } finally {
      setAddingTable(false);
    }
  }

  async function handleSaveTable(id: string) {
    if (!editTableName.trim()) return;
    const res = await fetch(`/api/t/${slug}/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editTableName.trim(), capacity: editTableCap }),
    });
    if (res.ok) {
      toast.success("已儲存");
      setEditTableId(null);
      load();
    }
  }

  async function handleDeleteTable(id: string, name: string) {
    if (!confirm(`確定刪除桌位「${name}」？`)) return;
    const res = await fetch(`/api/t/${slug}/tables/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("桌位已刪除");
      load();
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b"><h2 className="font-semibold text-gray-900">桌位管理</h2></div>
        <div className="p-5 text-sm text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">桌位管理</h2>
        <button
          onClick={() => setShowNewFloor((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-red-700 border border-red-200 hover:bg-red-50 transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          新增空間
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* New floor form */}
        {showNewFloor && (
          <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <input
              type="text"
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              placeholder="空間名稱（如：2樓、獨立包廂）"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              onKeyDown={(e) => e.key === "Enter" && handleAddFloor()}
              autoFocus
            />
            <button
              onClick={handleAddFloor}
              disabled={addingFloor}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg"
            >
              <Check className="w-3.5 h-3.5" /> 確認
            </button>
            <button
              onClick={() => { setShowNewFloor(false); setNewFloorName(""); }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {floors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">尚無空間，請先新增空間</p>
        ) : (
          <>
            {/* Floor tabs */}
            <div className="flex gap-2 flex-wrap items-center">
              {floors.map((floor) => (
                <div key={floor.id} className="flex items-center gap-0.5">
                  {editFloorId === floor.id ? (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                      <input
                        type="text"
                        value={editFloorName}
                        onChange={(e) => setEditFloorName(e.target.value)}
                        className="text-sm border-none bg-transparent focus:outline-none w-24"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameFloor(floor.id);
                          if (e.key === "Escape") setEditFloorId(null);
                        }}
                      />
                      <button onClick={() => handleRenameFloor(floor.id)} className="text-green-600 hover:text-green-700">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditFloorId(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveFloorId(floor.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeFloorId === floor.id
                          ? "bg-red-700 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {floor.name}
                      <span className={`ml-1 text-xs ${activeFloorId === floor.id ? "text-red-200" : "text-gray-400"}`}>
                        ({floor.tables.length})
                      </span>
                    </button>
                  )}
                  {editFloorId !== floor.id && (
                    <>
                      <button
                        onClick={() => { setEditFloorId(floor.id); setEditFloorName(floor.name); }}
                        className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                        title="改名"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteFloor(floor.id, floor.name)}
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                        title="刪除空間"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Tables in active floor */}
            {activeFloor && (
              <div className="space-y-3">
                {activeFloor.tables.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">此空間尚無桌位</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {activeFloor.tables.map((t) => (
                    <div key={t.id} className="border border-gray-100 rounded-xl px-3 py-2.5">
                      {editTableId === t.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTableName}
                            onChange={(e) => setEditTableName(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 whitespace-nowrap">人數上限</label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={editTableCap}
                              onChange={(e) => setEditTableCap(Number(e.target.value))}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleSaveTable(t.id)}
                              className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded-lg"
                            >
                              <Check className="w-3 h-3" /> 儲存
                            </button>
                            <button
                              onClick={() => setEditTableId(null)}
                              className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs py-1 rounded-lg"
                            >
                              <X className="w-3 h-3" /> 取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{t.name}</p>
                            <p className="text-xs text-gray-400">最多 {t.capacity} 人</p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => handleToggleTable(t.id, t.isActive)}
                              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                                t.isActive
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {t.isActive ? "啟用" : "停用"}
                            </button>
                            <button
                              onClick={() => { setEditTableId(t.id); setEditTableName(t.name); setEditTableCap(t.capacity); }}
                              className="p-1 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50"
                              title="編輯"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTable(t.id, t.name)}
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

                {/* Add table */}
                <div className="flex gap-2 pt-1 border-t">
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder={`新桌位名稱（如：${activeFloor.name}-1）`}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
                  />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newTableCap}
                    onChange={(e) => setNewTableCap(Number(e.target.value))}
                    className="w-16 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="人數上限"
                  />
                  <button
                    onClick={handleAddTable}
                    disabled={addingTable}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-xl whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" /> 新增
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
