"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("superadmin-credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.ok) {
      router.push("/superadmin");
      router.refresh();
    } else {
      setError("帳號或密碼錯誤");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0D1757 0%, #1A237E 50%, #283593 100%)" }}
    >
      {/* Decorative tiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5 select-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-6xl font-bold"
            style={{
              left: `${(i % 5) * 22}%`,
              top: `${Math.floor(i / 5) * 26}%`,
              color: "#fff",
              fontFamily: "serif",
            }}
          >
            {["中", "發", "白", "一萬", "九筒"][i % 5]}
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🀄</div>
            <h1 className="text-2xl font-bold tracking-widest text-white">超級後台</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              SaaS 管理系統
            </p>
            <div
              className="h-px mt-4 mx-auto w-24"
              style={{ background: "linear-gradient(90deg, transparent, rgba(99,120,255,0.6), transparent)" }}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                管理員帳號
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(99,120,255,0.6)";
                  e.target.style.background = "rgba(255,255,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.12)";
                  e.target.style.background = "rgba(255,255,255,0.08)";
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(99,120,255,0.6)";
                  e.target.style.background = "rgba(255,255,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.12)";
                  e.target.style.background = "rgba(255,255,255,0.08)";
                }}
              />
            </div>

            {error && (
              <div
                className="px-4 py-2.5 rounded-xl text-sm text-center"
                style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider transition-all mt-2"
              style={{
                background: loading ? "rgba(57,73,171,0.5)" : "linear-gradient(135deg, #3949AB, #283593)",
                color: "#fff",
                border: "1px solid rgba(99,120,255,0.3)",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 15px rgba(57,73,171,0.4)",
              }}
            >
              {loading ? "驗證中..." : "登入後台"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
            麻將館 SaaS · 超級管理員
          </p>
        </div>
      </div>
    </div>
  );
}
