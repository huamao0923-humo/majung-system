"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function TenantLoginPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [loading, setLoading] = useState(false);

  async function handleDemoLogin(role: "member" | "admin") {
    setLoading(true);
    try {
      const res = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) return;
      router.push(role === "admin" ? `/t/${slug}/admin` : `/t/${slug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #3D0000 0%, #8B0000 40%, #5C1010 70%, #1A0500 100%)" }}>

      {/* 背景裝飾：大型麻將牌紋 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none"
        style={{ fontSize: "120px", lineHeight: "1", color: "#D4AF37", overflow: "hidden" }}>
        <div className="absolute top-[-20px] left-[-20px] rotate-[-15deg]">🀇🀈🀉🀊🀋🀌🀍🀎🀏</div>
        <div className="absolute bottom-[-20px] right-[-20px] rotate-[15deg]">🀙🀚🀛🀜🀝🀞🀟🀠🀡</div>
        <div className="absolute top-1/2 left-[-60px] rotate-[-30deg] opacity-50">🀄🀅🀆</div>
        <div className="absolute top-1/4 right-[-40px] rotate-[20deg] opacity-50">🀄🀅🀆</div>
      </div>

      {/* 金色裝飾圓 */}
      <div className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }} />
      <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }} />

      {/* 主卡片 */}
      <div className="relative w-full max-w-sm mx-4">
        {/* 金色外框裝飾 */}
        <div className="absolute -inset-[2px] rounded-2xl pointer-events-none"
          style={{ background: "linear-gradient(135deg, #D4AF37, #8B6914, #D4AF37, #5C3D0A, #D4AF37)", padding: "2px" }}>
          <div className="w-full h-full rounded-2xl" style={{ background: "#1A0500" }} />
        </div>

        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(160deg, #FFFBF0 0%, #FDF6E3 60%, #FAF0D7 100%)" }}>

          {/* 頂部紅色橫幅 */}
          <div className="relative px-8 py-6 text-center"
            style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)" }}>
            {/* 橫幅金色頂邊線 */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
            {/* 橫幅金色底邊線 */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px]"
              style={{ background: "linear-gradient(90deg, transparent, #D4AF3780, transparent)" }} />

            <div className="text-5xl mb-2">🀄</div>
            <h1 className="text-2xl font-bold tracking-[0.2em]" style={{ color: "#D4AF37" }}>麻 將 館</h1>
            <p className="text-xs mt-1 tracking-widest" style={{ color: "#D4AF3799" }}>線上預約系統</p>
          </div>

          {/* 登入區域 */}
          <div className="px-8 py-6 space-y-4">
            {/* 金色分隔裝飾 */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #D4AF37)" }} />
              <span className="text-xs tracking-widest" style={{ color: "#8B6914" }}>會員登入</span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
            </div>

            <p className="text-center text-sm" style={{ color: "#6B4C2A" }}>
              使用 LINE 帳號快速登入預約桌位
            </p>

            {/* LINE 登入按鈕 */}
            <button
              onClick={() => signIn("line", { callbackUrl: `/t/${slug}` })}
              className="w-full flex items-center justify-center gap-2 font-semibold h-12 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#06C755", color: "white", fontSize: "15px" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              以 LINE 帳號登入
            </button>

            {/* 分隔線 */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "#D4AF3740" }} />
              <span className="text-xs" style={{ color: "#9CA3AF" }}>或 Demo 體驗</span>
              <div className="flex-1 h-px" style={{ background: "#D4AF3740" }} />
            </div>

            {/* Demo 按鈕 */}
            <button
              onClick={() => handleDemoLogin("member")}
              disabled={loading}
              className="w-full h-11 rounded-xl font-medium text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #D4AF37, #B8962E)", color: "#1A0A00" }}
            >
              {loading ? "登入中..." : "👤 體驗會員端"}
            </button>

            <button
              onClick={() => handleDemoLogin("admin")}
              disabled={loading}
              className="w-full h-11 rounded-xl font-medium text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #3D0000, #6B0000)", color: "#D4AF37", border: "1px solid #D4AF3740" }}
            >
              {loading ? "登入中..." : "👨‍💼 體驗管理後台"}
            </button>
          </div>

          {/* 底部 */}
          <div className="px-8 pb-5 text-center">
            <div className="h-px mb-3" style={{ background: "linear-gradient(90deg, transparent, #D4AF3740, transparent)" }} />
            <p className="text-xs" style={{ color: "#9CA3AF" }}>登入即表示同意本系統之服務條款</p>
          </div>
        </div>
      </div>
    </div>
  );
}
