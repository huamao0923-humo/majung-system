"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlacklistToggle({ id, isBlacklisted }: { id: string; isBlacklisted: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(isBlacklisted);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlacklisted: !current }),
      });
      if (res.ok) {
        setCurrent((v) => !v);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded-full font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
      style={
        current
          ? { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }
          : { background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB" }
      }
    >
      {loading ? "…" : current ? "黑名單" : "正常"}
    </button>
  );
}
