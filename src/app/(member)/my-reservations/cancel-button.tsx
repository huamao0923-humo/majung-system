"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CancelButton({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("確定要取消此預約嗎？")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        toast.success("預約已取消");
        router.refresh();
      } else {
        toast.error("取消失敗，請稍後再試");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 text-xs"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? "取消中..." : "取消預約"}
    </Button>
  );
}
