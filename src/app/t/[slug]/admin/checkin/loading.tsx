export default function Loading() {
  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-28 rounded-xl" style={{ background: "rgba(139,0,0,0.08)" }} />
        <div className="h-4 w-40 rounded-lg" style={{ background: "rgba(139,0,0,0.05)" }} />
      </div>
      <div className="rounded-2xl h-14" style={{ background: "rgba(139,0,0,0.04)", border: "1px solid rgba(212,175,55,0.1)" }} />
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(212,175,55,0.1)" }}>
        <div className="h-11" style={{ background: "rgba(26,5,0,0.06)" }} />
        <div className="bg-white divide-y" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: "rgba(139,0,0,0.06)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded" style={{ background: "rgba(139,0,0,0.06)" }} />
                <div className="h-3 w-44 rounded" style={{ background: "rgba(139,0,0,0.04)" }} />
              </div>
              <div className="h-8 w-20 rounded-xl" style={{ background: "rgba(139,0,0,0.06)" }} />
              <div className="h-8 w-20 rounded-xl" style={{ background: "rgba(139,0,0,0.04)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
