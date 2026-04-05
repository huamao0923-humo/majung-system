"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CalendarCheck } from "lucide-react";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  lineChannelId: string | null;
  lineChannelSecret: string | null;
  lineMessagingToken: string | null;
  lineLiffId: string | null;
  isActive: boolean;
  plan: string;
  createdAt: string;
  _count: { users: number; reservations: number };
}

export default function EditTenantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    lineChannelId: "",
    lineChannelSecret: "",
    lineMessagingToken: "",
    lineLiffId: "",
    isActive: true,
    plan: "basic",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/superadmin/tenants/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: TenantDetail) => {
        setTenant(data);
        setForm({
          name: data.name,
          slug: data.slug,
          lineChannelId: data.lineChannelId ?? "",
          lineChannelSecret: data.lineChannelSecret ?? "",
          lineMessagingToken: data.lineMessagingToken ?? "",
          lineLiffId: data.lineLiffId ?? "",
          isActive: data.isActive,
          plan: data.plan,
        });
      })
      .catch(() => setError("載入失敗"))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "儲存失敗");
      } else {
        setSuccess("已儲存");
        setTenant(data);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("網路錯誤");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    setError("");
    const newActive = !form.isActive;
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (res.ok) {
        set("isActive", newActive);
        setSuccess(newActive ? "服務已恢復" : "服務已暫停");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("操作失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setSeedLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}/seed`, { method: "POST" });
      if (res.ok) {
        setSeedDone(true);
        setSuccess("初始化完成");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error ?? "初始化失敗");
      }
    } catch {
      setError("初始化失敗");
    } finally {
      setSeedLoading(false);
    }
  }

  const inputStyle = {
    background: "#fff",
    border: "1px solid rgba(57,73,171,0.2)",
    borderRadius: "12px",
    color: "#1A237E",
    outline: "none",
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
  } as const;

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "6px",
    color: "rgba(26,35,126,0.6)",
    letterSpacing: "0.05em",
  } as const;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "rgba(57,73,171,0.5)" }}>載入中...</div>
      </div>
    );
  }

  if (!tenant && !loading) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: "#DC2626" }}>找不到此租戶</p>
        <Link href="/superadmin/tenants" className="text-sm mt-2 inline-block" style={{ color: "#3949AB" }}>
          ← 回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/superadmin/tenants"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-indigo-100"
          style={{ color: "#3949AB" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-wide truncate" style={{ color: "#1A237E" }}>
            {tenant?.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(57,73,171,0.5)" }}>
            建立於 {tenant ? new Date(tenant.createdAt).toLocaleDateString("zh-TW") : ""}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "white", border: "1px solid rgba(57,73,171,0.12)" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#EEF2FF" }}
          >
            <Users className="w-4 h-4" style={{ color: "#3949AB" }} />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: "#1A237E" }}>{tenant?._count.users}</p>
            <p className="text-xs" style={{ color: "rgba(57,73,171,0.5)" }}>用戶數</p>
          </div>
        </div>
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "white", border: "1px solid rgba(57,73,171,0.12)" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#EEF2FF" }}
          >
            <CalendarCheck className="w-4 h-4" style={{ color: "#3949AB" }} />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: "#1A237E" }}>{tenant?._count.reservations}</p>
            <p className="text-xs" style={{ color: "rgba(57,73,171,0.5)" }}>總預約數</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="rounded-2xl p-5 flex flex-wrap gap-3"
        style={{ background: "white", border: "1px solid rgba(57,73,171,0.15)" }}
      >
        <button
          onClick={handleSeed}
          disabled={seedLoading || seedDone}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: seedDone
              ? "#DCFCE7"
              : seedLoading
              ? "rgba(57,73,171,0.3)"
              : "#EEF2FF",
            color: seedDone ? "#166534" : "#3949AB",
            border: "1px solid",
            borderColor: seedDone ? "#BBF7D0" : "rgba(57,73,171,0.2)",
            cursor: seedLoading || seedDone ? "not-allowed" : "pointer",
          }}
        >
          {seedLoading ? "初始化中..." : seedDone ? "已初始化" : "一鍵初始化預設資料"}
        </button>

        <button
          onClick={handleToggleActive}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: form.isActive ? "#FEE2E2" : "#DCFCE7",
            color: form.isActive ? "#991B1B" : "#166534",
            border: `1px solid ${form.isActive ? "#FECACA" : "#BBF7D0"}`,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {form.isActive ? "暫停服務" : "恢復服務"}
        </button>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave}>
        <div
          className="rounded-2xl p-6 space-y-5 shadow-sm"
          style={{ background: "white", border: "1px solid rgba(57,73,171,0.15)" }}
        >
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A237E" }}>
              基本資料
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>館名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  required
                  pattern="[a-z0-9-]+"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>方案</label>
                <select
                  value={form.plan}
                  onChange={(e) => set("plan", e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="basic">基本</option>
                  <option value="pro">專業</option>
                  <option value="enterprise">企業</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.isActive}
                    onChange={(e) => set("isActive", e.target.checked)}
                  />
                  <div
                    className="w-10 h-5 rounded-full transition-colors peer-checked:bg-blue-600 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300"
                  />
                  <div
                    className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                  />
                </label>
                <span className="text-sm" style={{ color: "rgba(57,73,171,0.7)" }}>
                  {form.isActive ? "啟用" : "停用"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(57,73,171,0.08)" }} />

          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A237E" }}>
              LINE 設定
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>LINE Channel ID</label>
                <input
                  type="text"
                  value={form.lineChannelId}
                  onChange={(e) => set("lineChannelId", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>LINE Channel Secret</label>
                <input
                  type="text"
                  value={form.lineChannelSecret}
                  onChange={(e) => set("lineChannelSecret", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>LINE Messaging Token</label>
                <input
                  type="text"
                  value={form.lineMessagingToken}
                  onChange={(e) => set("lineMessagingToken", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>LINE LIFF ID</label>
                <input
                  type="text"
                  value={form.lineLiffId}
                  onChange={(e) => set("lineLiffId", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: "rgba(220,38,38,0.08)",
                color: "#DC2626",
                border: "1px solid rgba(220,38,38,0.15)",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: "#DCFCE7",
                color: "#166534",
                border: "1px solid #BBF7D0",
              }}
            >
              {success}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: saving
                  ? "rgba(57,73,171,0.4)"
                  : "linear-gradient(135deg, #3949AB, #1A237E)",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 12px rgba(57,73,171,0.3)",
              }}
            >
              {saving ? "儲存中..." : "儲存變更"}
            </button>
            <Link
              href="/superadmin/tenants"
              className="px-5 py-3 rounded-xl text-sm font-medium transition-all hover:bg-indigo-50"
              style={{ color: "#3949AB", border: "1px solid rgba(57,73,171,0.2)" }}
            >
              取消
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
