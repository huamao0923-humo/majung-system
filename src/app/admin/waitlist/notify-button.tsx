"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NotifyButton({ id, notified }: { id: string; notified: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(notified);

  async function handleNotify() {
    if (done || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notified: true }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span
        className="text-xs px-2.5 py-1 rounded-full font-medium"
        style={{ background: "#DCFCE7", color: "#166534" }}
      >
        已通知
      </span>
    );
  }

  return (
    <button
      onClick={handleNotify}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded-full font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, #8B0000, #6B0000)",
        color: "#D4AF37",
        border: "1px solid #D4AF3730",
      }}
    >
      {loading ? "傳送中…" : "通知候補"}
    </button>
  );
}
