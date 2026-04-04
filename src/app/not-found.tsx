export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FDF6E3" }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🀄</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#8B0000" }}>404 — 找不到頁面</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(139,0,0,0.6)" }}>您所尋找的頁面不存在</p>
        <a href="/" className="px-4 py-2 rounded-xl text-sm font-semibold"
           style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}>
          回首頁
        </a>
      </div>
    </div>
  );
}
