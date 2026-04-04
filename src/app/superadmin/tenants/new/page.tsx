"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface FormData {
  name: string;
  slug: string;
  lineChannelId: string;
  lineChannelSecret: string;
  lineMessagingToken: string;
  lineLiffId: string;
  plan: string;
}

export default function NewTenantPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: "",
    slug: "",
    lineChannelId: "",
    lineChannelSecret: "",
    lineMessagingToken: "",
    lineLiffId: "",
    plan: "basic",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // auto-generate slug from name
    if (field === "name") {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: prev.slug || value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "建立失敗");
      } else {
        setCreatedId(data.id);
      }
    } catch {
      setError("網路錯誤，請再試一次");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    if (!createdId) return;
    setSeedLoading(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${createdId}/seed`, { method: "POST" });
      if (res.ok) {
        setSeedDone(true);
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

  if (createdId) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div
          className="rounded-2xl p-8 text-center space-y-5 shadow-sm"
          style={{ background: "white", border: "1px solid rgba(57,73,171,0.15)" }}
        >
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#1A237E" }}>
              租戶建立成功！
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(57,73,171,0.6)" }}>
              接下來可以一鍵初始化預設資料（樓層、桌位、時段、公告）
            </p>
          </div>

          {!seedDone ? (
            <button
              onClick={handleSeed}
              disabled={seedLoading}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: seedLoading
                  ? "rgba(57,73,171,0.4)"
                  : "linear-gradient(135deg, #3949AB, #1A237E)",
                color: "#fff",
                cursor: seedLoading ? "not-allowed" : "pointer",
                boxShadow: seedLoading ? "none" : "0 4px 12px rgba(57,73,171,0.3)",
              }}
            >
              {seedLoading ? "初始化中..." : "一鍵初始化預設資料"}
            </button>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "#DCFCE7", color: "#166534" }}
            >
              初始化完成
            </div>
          )}

          {error && (
            <p className="text-sm" style={{ color: "#DC2626" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <Link
              href={`/superadmin/tenants/${createdId}`}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-indigo-50"
              style={{ color: "#3949AB", border: "1px solid rgba(57,73,171,0.2)" }}
            >
              查看詳情
            </Link>
            <Link
              href="/superadmin/tenants"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-indigo-50"
              style={{ color: "rgba(57,73,171,0.6)" }}
            >
              回列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/superadmin/tenants"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-indigo-100"
          style={{ color: "#3949AB" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: "#1A237E" }}>
            新增租戶
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(57,73,171,0.5)" }}>
            建立一間新的麻將館
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          className="rounded-2xl p-6 space-y-5 shadow-sm"
          style={{ background: "white", border: "1px solid rgba(57,73,171,0.15)" }}
        >
          {/* Basic info */}
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
                  placeholder="例：台北麻將館"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Slug（URL識別符）*</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="例：taipei-mahjong"
                  required
                  pattern="[a-z0-9-]+"
                  title="只能包含小寫英文、數字和連字符"
                  style={inputStyle}
                />
                <p className="text-xs mt-1" style={{ color: "rgba(57,73,171,0.4)" }}>
                  網址：/t/{form.slug || "..."}
                </p>
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
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(57,73,171,0.08)" }} />

          {/* LINE credentials */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A237E" }}>
              LINE 設定（選填）
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>LINE Channel ID</label>
                <input
                  type="text"
                  value={form.lineChannelId}
                  onChange={(e) => set("lineChannelId", e.target.value)}
                  placeholder="Channel ID"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>LINE Channel Secret</label>
                <input
                  type="text"
                  value={form.lineChannelSecret}
                  onChange={(e) => set("lineChannelSecret", e.target.value)}
                  placeholder="Channel Secret"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>LINE Messaging Token</label>
                <input
                  type="text"
                  value={form.lineMessagingToken}
                  onChange={(e) => set("lineMessagingToken", e.target.value)}
                  placeholder="Messaging Access Token"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>LINE LIFF ID</label>
                <input
                  type="text"
                  value={form.lineLiffId}
                  onChange={(e) => set("lineLiffId", e.target.value)}
                  placeholder="LIFF ID"
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

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: loading
                  ? "rgba(57,73,171,0.4)"
                  : "linear-gradient(135deg, #3949AB, #1A237E)",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 12px rgba(57,73,171,0.3)",
              }}
            >
              {loading ? "建立中..." : "建立租戶"}
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
