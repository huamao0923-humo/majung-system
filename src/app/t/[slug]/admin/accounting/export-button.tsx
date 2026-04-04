"use client";

import { Download } from "lucide-react";

interface Props {
  data: Record<string, unknown>[];
  filename: string;
}

export default function ExportButton({ data, filename }: Props) {
  function handleExport() {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-xl transition-colors"
    >
      <Download className="w-4 h-4" />
      匯出 CSV
    </button>
  );
}
