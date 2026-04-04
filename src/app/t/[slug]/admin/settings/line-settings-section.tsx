"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  slug: string;
  lineChannelId: string | null;
  lineChannelSecret: string | null;
  lineMessagingToken: string | null;
  lineLiffId: string | null;
}

function maskValue(val: string | null) {
  if (!val) return "";
  if (val.length <= 6) return "●".repeat(val.length);
  return val.slice(0, 3) + "●".repeat(Math.min(val.length - 6, 16)) + val.slice(-3);
}

export default function LineSettingsSection({
  slug,
  lineChannelId: initChannelId,
  lineChannelSecret: initSecret,
  lineMessagingToken: initToken,
  lineLiffId: initLiffId,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [lineChannelId, setLineChannelId] = useState(initChannelId ?? "");
  const [lineChannelSecret, setLineChannelSecret] = useState(initSecret ?? "");
  const [lineMessagingToken, setLineMessagingToken] = useState(initToken ?? "");
  const [lineLiffId, setLineLiffId] = useState(initLiffId ?? "");
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/t/${slug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineChannelId, lineChannelSecret, lineMessagingToken, lineLiffId }),
      });
      if (res.ok) {
        toast.success("LINE 設定已儲存");
        setEditing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "儲存失敗");
      }
    } catch {
      toast.error("網路錯誤，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { label: "Channel ID", value: initChannelId, editValue: lineChannelId, setter: setLineChannelId, sensitive: false },
    { label: "Channel Secret", value: initSecret, editValue: lineChannelSecret, setter: setLineChannelSecret, sensitive: true, showState: showSecret, toggleShow: () => setShowSecret((v) => !v) },
    { label: "Messaging Token", value: initToken, editValue: lineMessagingToken, setter: setLineMessagingToken, sensitive: true, showState: showToken, toggleShow: () => setShowToken((v) => !v) },
    { label: "LIFF ID", value: initLiffId, editValue: lineLiffId, setter: setLineLiffId, sensitive: false },
  ] as const;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #D4AF3720" }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #D4AF3720" }}>
        <h2 className="font-semibold" style={{ color: "#1A0500" }}>LINE 設定</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-1.5 rounded-xl font-medium transition-opacity hover:opacity-80"
            style={{ background: "#FDF6E3", border: "1px solid #D4AF3740", color: "rgba(139,0,0,0.7)" }}
          >
            編輯
          </button>
        )}
      </div>
      <div className="p-5 space-y-4">
        {editing ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Channel ID */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(139,0,0,0.65)" }}>
                  Channel ID
                </label>
                <input
                  type="text"
                  value={lineChannelId}
                  onChange={(e) => setLineChannelId(e.target.value)}
                  placeholder="LINE Channel ID"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  style={{ borderColor: "#D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
                />
              </div>
              {/* LIFF ID */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(139,0,0,0.65)" }}>
                  LIFF ID
                </label>
                <input
                  type="text"
                  value={lineLiffId}
                  onChange={(e) => setLineLiffId(e.target.value)}
                  placeholder="LINE LIFF ID"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  style={{ borderColor: "#D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
                />
              </div>
              {/* Channel Secret */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(139,0,0,0.65)" }}>
                  Channel Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={lineChannelSecret}
                    onChange={(e) => setLineChannelSecret(e.target.value)}
                    placeholder="LINE Channel Secret"
                    className="w-full border rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    style={{ borderColor: "#D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Messaging Token */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(139,0,0,0.65)" }}>
                  Messaging Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={lineMessagingToken}
                    onChange={(e) => setLineMessagingToken(e.target.value)}
                    placeholder="LINE Messaging Access Token"
                    className="w-full border rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    style={{ borderColor: "#D4AF3730", background: "#FDF6E3", color: "#1A0500" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-sm px-4 py-2 rounded-xl font-medium"
                style={{ background: "#F5F5F5", color: "rgba(0,0,0,0.5)" }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm px-5 py-2 rounded-xl font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
              >
                {saving ? "儲存中…" : "儲存 LINE 設定"}
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Channel ID", value: initChannelId },
              { label: "LIFF ID", value: initLiffId },
              { label: "Channel Secret", value: initSecret, sensitive: true },
              { label: "Messaging Token", value: initToken, sensitive: true },
            ].map(({ label, value, sensitive }) => (
              <div
                key={label}
                className="rounded-xl px-4 py-3"
                style={{ background: "#FDF6E3", border: "1px solid #D4AF3720" }}
              >
                <p className="text-xs mb-1" style={{ color: "rgba(139,0,0,0.5)" }}>{label}</p>
                <p className="text-sm font-mono font-medium truncate" style={{ color: "#1A0500" }}>
                  {value ? (sensitive ? maskValue(value) : value) : (
                    <span style={{ color: "rgba(139,0,0,0.3)" }}>未設定</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
