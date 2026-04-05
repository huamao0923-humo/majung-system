"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
}

interface Props {
  announcements: Announcement[];
  slug: string;
}

export default function TenantAnnouncementsSection({ announcements, slug }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", content: "" });
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!form.title || !form.content) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/t/${slug}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("公告已新增");
        setForm({ title: "", content: "" });
        router.refresh();
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定刪除此公告？")) return;
    const res = await fetch(`/api/t/${slug}/announcements?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("刪除失敗"); return; }
    toast.success("公告已刪除");
    router.refresh();
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/t/${slug}/announcements`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    if (!res.ok) { toast.error("操作失敗"); return; }
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold text-gray-900">公告管理</h2>
      </div>
      <div className="p-5 space-y-3">
        <div className="space-y-2">
          {announcements.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">尚無公告</p>
          )}
          {announcements.map((a) => (
            <div key={a.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.content}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(a.id, a.isActive)}
                    className={`text-xs px-2 py-1 rounded-full ${a.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {a.isActive ? "顯示中" : "已隱藏"}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-2">
          <input
            type="text"
            placeholder="公告標題"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <textarea
            placeholder="公告內容..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> 新增公告
          </button>
        </div>
      </div>
    </div>
  );
}
