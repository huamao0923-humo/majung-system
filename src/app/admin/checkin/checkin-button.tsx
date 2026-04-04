"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

export default function CheckinButton({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "checked_in" }),
      });
      if (res.ok) {
        toast.success("入場確認成功");
        router.refresh();
      } else {
        toast.error("操作失敗");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckin}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 font-medium"
      style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
    >
      <CheckCircle className="w-4 h-4" />
      {loading ? "確認中" : "確認入場"}
    </button>
  );
}
