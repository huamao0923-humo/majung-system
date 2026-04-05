"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { LayoutDashboard, CalendarDays, CheckSquare, CreditCard, BarChart3, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const navItems = [
    { href: `/t/${slug}/admin`, icon: LayoutDashboard, label: "儀表板" },
    { href: `/t/${slug}/admin/reservations`, icon: CalendarDays, label: "預約管理" },
    { href: `/t/${slug}/admin/members`, icon: Users, label: "會員管理" },
    { href: `/t/${slug}/admin/checkin`, icon: CheckSquare, label: "入場確認" },
    { href: `/t/${slug}/admin/payment`, icon: CreditCard, label: "繳費管理" },
    { href: `/t/${slug}/admin/accounting`, icon: BarChart3, label: "帳務報表" },
    { href: `/t/${slug}/admin/settings`, icon: Settings, label: "系統設定" },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "#FDF6E3" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0"
        style={{ background: "linear-gradient(180deg, #1A0500 0%, #0D0200 100%)", borderRight: "1px solid #D4AF3725" }}
      >
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid #D4AF3725" }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🀄</span>
            <div>
              <div className="font-bold tracking-widest text-base" style={{ color: "#D4AF37" }}>麻將館</div>
              <div className="text-xs tracking-wide mt-0.5" style={{ color: "#D4AF3760" }}>管理後台</div>
            </div>
          </div>
          {/* 金色底線 */}
          <div className="h-px mt-4" style={{ background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  active ? "font-semibold" : "hover:bg-white/5"
                )}
                style={
                  active
                    ? { background: "linear-gradient(135deg, #8B000090, #6B000060)", color: "#D4AF37", border: "1px solid #D4AF3730" }
                    : { color: "#D4AF3799" }
                }
              >
                {active && (
                  <div className="absolute left-0 w-[3px] h-6 rounded-r-full" style={{ background: "#D4AF37" }} />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: "1px solid #D4AF3720" }}>
          <Link
            href={`/t/${slug}`}
            className="text-xs flex items-center gap-2 transition-colors hover:opacity-80"
            style={{ color: "#D4AF3760" }}
          >
            ← 回會員端
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #1A0500, #0D0200)", borderBottom: "1px solid #D4AF3730" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🀄</span>
          <span className="font-bold tracking-wider text-sm" style={{ color: "#D4AF37" }}>麻將館後台</span>
        </div>
        <Link href={`/t/${slug}`} className="text-xs" style={{ color: "#D4AF3780" }}>← 前台</Link>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5"
        style={{ background: "#0D0200", borderTop: "1px solid #D4AF3730" }}
      >
        {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-2.5"
              style={{ color: active ? "#D4AF37" : "#D4AF3750" }}
            >
              <Icon className="w-4 h-4" />
              <span style={{ fontSize: "10px" }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
