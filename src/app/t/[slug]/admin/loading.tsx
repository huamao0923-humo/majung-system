export default function AdminLoading() {
  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-xl" style={{ background: "rgba(139,0,0,0.08)" }} />
          <div className="h-4 w-24 rounded-lg" style={{ background: "rgba(139,0,0,0.05)" }} />
        </div>
        <div className="h-9 w-24 rounded-xl" style={{ background: "rgba(139,0,0,0.06)" }} />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 h-28" style={{ background: "rgba(139,0,0,0.04)", border: "1px solid rgba(212,175,55,0.1)" }} />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(212,175,55,0.1)" }}>
        <div className="h-12" style={{ background: "rgba(26,5,0,0.06)" }} />
        <div className="divide-y bg-white" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: "rgba(139,0,0,0.06)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded" style={{ background: "rgba(139,0,0,0.06)" }} />
                <div className="h-3 w-48 rounded" style={{ background: "rgba(139,0,0,0.04)" }} />
              </div>
              <div className="h-6 w-16 rounded-full" style={{ background: "rgba(139,0,0,0.06)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
