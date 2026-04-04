"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  reservation: { id: string; status: string };
}

export default function ReservationActions({ reservation }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("狀態已更新");
        router.refresh();
      } else {
        toast.error("更新失敗");
      }
    } finally {
      setLoading(false);
    }
  }

  const { status } = reservation;
  return (
    <div className="flex items-center gap-1">
      {status === "pending" && (
        <button
          onClick={() => update("confirmed")}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#DCFCE7", color: "#166534" }}
        >
          確認
        </button>
      )}
      {status === "confirmed" && (
        <button
          onClick={() => update("checked_in")}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#DBEAFE", color: "#1E40AF" }}
        >
          入場
        </button>
      )}
      {(status === "pending" || status === "confirmed") && (
        <button
          onClick={() => update("cancelled")}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#FEE2E2", color: "#991B1B" }}
        >
          取消
        </button>
      )}
    </div>
  );
}
