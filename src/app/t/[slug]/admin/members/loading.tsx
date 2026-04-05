export default function Loading() {
  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-24 rounded-xl" style={{ background: "rgba(139,0,0,0.08)" }} />
          <div className="h-4 w-20 rounded-lg" style={{ background: "rgba(139,0,0,0.05)" }} />
        </div>
        <div className="h-9 w-24 rounded-xl" style={{ background: "rgba(139,0,0,0.06)" }} />
      </div>
      <div className="rounded-2xl h-14" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)" }} />
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(212,175,55,0.1)" }}>
        <div className="h-11" style={{ background: "rgba(26,5,0,0.06)" }} />
        <div className="bg-white divide-y" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: "rgba(139,0,0,0.06)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded" style={{ background: "rgba(139,0,0,0.06)" }} />
                <div className="h-3 w-20 rounded" style={{ background: "rgba(139,0,0,0.04)" }} />
              </div>
              <div className="h-4 w-8 rounded" style={{ background: "rgba(139,0,0,0.05)" }} />
              <div className="h-4 w-8 rounded" style={{ background: "rgba(139,0,0,0.05)" }} />
              <div className="h-6 w-14 rounded-full" style={{ background: "rgba(139,0,0,0.06)" }} />
              <div className="h-7 w-16 rounded-lg" style={{ background: "rgba(139,0,0,0.05)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
