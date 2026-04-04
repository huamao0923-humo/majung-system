"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FDF6E3" }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🀄</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#8B0000" }}>系統發生錯誤</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(139,0,0,0.6)" }}>{error.message}</p>
        <button onClick={reset} className="px-4 py-2 rounded-xl text-sm font-semibold"
           style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}>
          重試
        </button>
      </div>
    </div>
  );
}
