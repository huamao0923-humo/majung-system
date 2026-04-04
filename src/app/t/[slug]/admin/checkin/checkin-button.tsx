"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

export default function TenantCheckinButton({
  reservationId,
  slug,
}: {
  reservationId: string;
  slug: string;
}) {
  const router = useRouter();
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [loadingNoShow, setLoadingNoShow] = useState(false);

  async function updateStatus(status: "checked_in" | "no_show") {
    const isCheckin = status === "checked_in";
    if (isCheckin) setLoadingCheckin(true);
    else setLoadingNoShow(true);

    try {
      const res = await fetch(`/api/t/${slug}/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(isCheckin ? "入場確認成功" : "已標記為未到場");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "操作失敗");
      }
    } catch {
      toast.error("網路錯誤，請稍後再試");
    } finally {
      if (isCheckin) setLoadingCheckin(false);
      else setLoadingNoShow(false);
    }
  }

  const anyLoading = loadingCheckin || loadingNoShow;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* No-show button */}
      <button
        onClick={() => updateStatus("no_show")}
        disabled={anyLoading}
        className="flex items-center gap-1 text-sm px-3 py-2 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40 font-medium"
        style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
      >
        <XCircle className="w-4 h-4" />
        {loadingNoShow ? "處理中" : "未到場"}
      </button>

      {/* Check-in button */}
      <button
        onClick={() => updateStatus("checked_in")}
        disabled={anyLoading}
        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 font-medium"
        style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
      >
        <CheckCircle className="w-4 h-4" />
        {loadingCheckin ? "確認中" : "確認入場"}
      </button>
    </div>
  );
}
