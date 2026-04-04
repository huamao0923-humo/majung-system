"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  payment: { id: string; amount: number };
}

const METHODS = ["現金", "LINE Pay", "轉帳", "其他"];

export default function PaymentForm({ payment }: Props) {
  const router = useRouter();
  const [method, setMethod] = useState("現金");
  const [amount, setAmount] = useState(payment.amount);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", method, amount }),
      });
      if (res.ok) {
        toast.success("繳費已確認，LINE 通知已傳送");
        router.refresh();
      } else {
        toast.error("操作失敗");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="rounded-xl px-3 py-2 text-sm w-28 focus:outline-none"
        style={{ border: "1px solid rgba(212,175,55,0.3)", background: "#FDF6E3", color: "#1A0500" }}
        min={0}
      />
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="rounded-xl px-3 py-2 text-sm focus:outline-none"
        style={{ border: "1px solid rgba(212,175,55,0.3)", background: "#FDF6E3", color: "#1A0500" }}
      >
        {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="text-sm px-5 py-2 rounded-xl font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
      >
        {loading ? "確認中..." : "確認收款"}
      </button>
    </div>
  );
}
