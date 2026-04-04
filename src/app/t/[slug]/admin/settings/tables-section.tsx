"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Table {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
}

interface Props {
  tables: Table[];
  slug: string;
}

export default function TenantTablesSection({ tables, slug }: Props) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/t/${slug}/tables`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    router.refresh();
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/t/${slug}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), order: tables.length }),
      });
      if (res.ok) {
        toast.success("桌位已新增");
        setNewName("");
        router.refresh();
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold text-gray-900">桌位管理</h2>
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {tables.map((t) => (
            <div key={t.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-sm text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">最多 {t.capacity} 人</p>
              </div>
              <button
                onClick={() => handleToggle(t.id, t.isActive)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  t.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {t.isActive ? "啟用中" : "已停用"}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新桌位名稱（如：桌11）"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> 新增
          </button>
        </div>
      </div>
    </div>
  );
}
