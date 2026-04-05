export default function Loading() {
  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-28 rounded-xl" style={{ background: "rgba(139,0,0,0.08)" }} />
        <div className="h-4 w-36 rounded-lg" style={{ background: "rgba(139,0,0,0.05)" }} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="h-5 w-32 rounded" style={{ background: "rgba(139,0,0,0.07)" }} />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-10 rounded-xl" style={{ background: "rgba(139,0,0,0.04)" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
