"use client";

import { useState } from "react";
import { KeyRound, X, Eye, EyeOff } from "lucide-react";

interface Props {
  tenantId: string;
  tenantName: string;
  currentUsername?: string | null;
  onSuccess?: () => void;
}

export default function SetAdminModal({ tenantId, tenantName, currentUsername, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(currentUsername ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch(`/api/superadmin/tenants/${tenantId}/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "設定失敗");
      return;
    }

    setSuccess(true);
    setPassword("");
    onSuccess?.();
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
    }, 1200);
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(""); setSuccess(false); }}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-indigo-100 ml-1"
        style={{ color: "#5C6BC0", border: "1px solid rgba(57,73,171,0.2)" }}
        title="設定管理員帳號"
      >
        <KeyRound className="w-3.5 h-3.5" />
        {currentUsername ? "改密碼" : "設定帳號"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "white" }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #1A237E, #0D1757)", borderBottom: "1px solid rgba(121,134,203,0.2)" }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#C5CAE9" }}>設定管理員帳號</p>
                <p className="text-xs mt-0.5" style={{ color: "#7986CB99" }}>{tenantName}</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: "#7986CB" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#3949AB" }}>
                  管理員帳號
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="設定登入帳號"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "#EEF2FF", border: "1px solid rgba(57,73,171,0.25)", color: "#1A237E" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#3949AB" }}>
                  密碼（{currentUsername ? "留空則不更改" : "至少 6 個字元"}）
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={currentUsername ? "留空則不更改密碼" : "設定密碼（至少 6 字元）"}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                    style={{ background: "#EEF2FF", border: "1px solid rgba(57,73,171,0.25)", color: "#1A237E" }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#7986CB" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg text-center"
                  style={{ background: "#FEE2E2", color: "#991B1B" }}>{error}</p>
              )}
              {success && (
                <p className="text-xs px-3 py-2 rounded-lg text-center"
                  style={{ background: "#DCFCE7", color: "#166534" }}>設定成功！</p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 h-10 rounded-xl text-sm transition-colors hover:bg-gray-100"
                  style={{ color: "#6B7280", border: "1px solid #E5E7EB" }}>
                  取消
                </button>
                <button type="submit" disabled={loading || !username || (!currentUsername && !password)}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #3949AB, #1A237E)", color: "#C5CAE9" }}>
                  {loading ? "儲存中..." : "儲存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
