"use client";

export const dynamic = "force-dynamic";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 若已登入則自動導向
  useEffect(() => {
    if (status === "authenticated" && session) {
      if (session.user.role === "superadmin") {
        router.push("/superadmin");
      } else if (session.user.tenantSlug) {
        router.push(`/t/${session.user.tenantSlug}/admin`);
      } else if (session.user.tenantId) {
        // LINE 登入的 admin（舊流程）
        router.push("/");
      }
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");

    const result = await signIn("tenant-admin", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("帳號或密碼錯誤");
      setLoading(false);
      return;
    }

    // 登入成功，useEffect 會自動導向
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0D1757 0%, #1A237E 40%, #283593 70%, #0D1B5E 100%)" }}
    >
      {/* 背景裝飾 */}
      <div className="absolute top-20 left-20 w-40 h-40 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #7986CB, transparent)" }} />
      <div className="absolute bottom-20 right-20 w-56 h-56 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #5C6BC0, transparent)" }} />

      <div className="relative w-full max-w-sm mx-4">
        {/* 外框裝飾 */}
        <div className="absolute -inset-[2px] rounded-2xl pointer-events-none"
          style={{ background: "linear-gradient(135deg, #7986CB, #3949AB, #7986CB, #1A237E, #7986CB)", padding: "2px" }}>
          <div className="w-full h-full rounded-2xl" style={{ background: "#0D1757" }} />
        </div>

        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #F8F9FF 60%, #EEF2FF 100%)" }}>

          {/* 頂部橫幅 */}
          <div className="relative px-8 py-6 text-center"
            style={{ background: "linear-gradient(135deg, #1A237E, #0D1757)" }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(90deg, transparent, #7986CB, transparent)" }} />
            <div className="absolute bottom-0 left-0 right-0 h-[1px]"
              style={{ background: "linear-gradient(90deg, transparent, #7986CB60, transparent)" }} />
            <div className="text-4xl mb-2">🏢</div>
            <h1 className="text-xl font-bold tracking-[0.15em]" style={{ color: "#C5CAE9" }}>管理員登入</h1>
            <p className="text-xs mt-1 tracking-widest" style={{ color: "#7986CB99" }}>麻將館管理系統</p>
          </div>

          {/* 表單區域 */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #7986CB)" }} />
              <span className="text-xs tracking-widest" style={{ color: "#5C6BC0" }}>帳號登入</span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #7986CB, transparent)" }} />
            </div>

            {/* 帳號 */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#3949AB" }}>
                管理員帳號
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="輸入帳號"
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "#EEF2FF",
                  border: "1px solid rgba(57,73,171,0.25)",
                  color: "#1A237E",
                }}
              />
            </div>

            {/* 密碼 */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#3949AB" }}>
                密碼
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入密碼"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#EEF2FF",
                    border: "1px solid rgba(57,73,171,0.25)",
                    color: "#1A237E",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#7986CB" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 錯誤提示 */}
            {error && (
              <p className="text-xs text-center px-3 py-2 rounded-lg"
                style={{ background: "#FEE2E2", color: "#991B1B" }}>
                {error}
              </p>
            )}

            {/* 登入按鈕 */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{
                background: "linear-gradient(135deg, #3949AB, #1A237E)",
                color: "#C5CAE9",
                boxShadow: "0 4px 12px rgba(57,73,171,0.3)",
              }}
            >
              {loading ? "登入中..." : "登入管理後台"}
            </button>
          </form>

          {/* 底部 */}
          <div className="px-8 pb-5 text-center">
            <div className="h-px mb-3"
              style={{ background: "linear-gradient(90deg, transparent, #7986CB40, transparent)" }} />
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              此頁面僅供租戶管理員使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
