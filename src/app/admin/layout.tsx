"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, CheckSquare, CreditCard,
  BarChart3, Settings, Users, ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BadgeProvider, useBadgeCounts } from "@/components/admin/badge-context";
import DailyQuote from "@/components/admin/daily-quote";

type BadgeKey = "pending" | "confirmedToday" | "unpaidToday";

const navItems: { href: string; icon: React.ElementType; label: string; badgeKey?: BadgeKey }[] = [
  { href: "/admin",              icon: LayoutDashboard, label: "儀表板" },
  { href: "/admin/reservations", icon: CalendarDays,   label: "預約管理", badgeKey: "pending" },
  { href: "/admin/checkin",      icon: CheckSquare,    label: "入場確認", badgeKey: "confirmedToday" },
  { href: "/admin/payment",      icon: CreditCard,     label: "繳費管理", badgeKey: "unpaidToday" },
  { href: "/admin/accounting",   icon: BarChart3,      label: "帳務報表" },
  { href: "/admin/waitlist",     icon: ListOrdered,    label: "候補名單" },
  { href: "/admin/members",      icon: Users,          label: "會員管理" },
  { href: "/admin/settings",     icon: Settings,       label: "系統設定" },
];

function SidebarNav() {
  const pathname = usePathname();
  const counts = useBadgeCounts();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navItems.map(({ href, icon: Icon, label, badgeKey }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        const badgeCount = badgeKey ? counts[badgeKey] : 0;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
              active ? "font-semibold" : "hover:bg-white/5"
            )}
            style={
              active
                ? { background: "linear-gradient(135deg, #8B000090, #6B000060)", color: "#D4AF37", border: "1px solid #D4AF3730" }
                : { color: "#D4AF3799" }
            }
          >
            {active && (
              <div
                className="absolute left-0 w-[3px] h-5 rounded-r-full"
                style={{ background: "#D4AF37" }}
              />
            )}
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badgeCount > 0 && (
              <span
                className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                style={{ background: "#8B0000", color: "#FDF6E3", border: "1px solid rgba(212,175,55,0.3)" }}
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const counts = useBadgeCounts();
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid"
      style={{
        gridTemplateColumns: `repeat(${mobileItems.length}, 1fr)`,
        background: "#0D0200",
        borderTop: "1px solid #D4AF3730",
      }}
    >
      {mobileItems.map(({ href, icon: Icon, label, badgeKey }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        const badgeCount = badgeKey ? counts[badgeKey] : 0;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-2.5 relative"
            style={{ color: active ? "#D4AF37" : "#D4AF3750" }}
          >
            <div className="relative">
              <Icon className="w-4 h-4" />
              {badgeCount > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: "#8B0000", color: "white" }}
                >
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: "10px" }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <BadgeProvider>
      <div className="flex min-h-screen" style={{ background: "#FDF6E3" }}>
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 flex-shrink-0"
          style={{ background: "linear-gradient(180deg, #1A0500 0%, #0D0200 100%)", borderRight: "1px solid #D4AF3725" }}
        >
          {/* Logo */}
          <div className="px-5 py-5" style={{ borderBottom: "1px solid #D4AF3725" }}>
            <div className="flex items-center gap-3">
              {/* 麻將牌 Logo（CSS） */}
              <div
                className="w-9 h-12 rounded-md flex items-center justify-center font-bold text-lg flex-shrink-0"
                style={{
                  background: "linear-gradient(150deg, #ffffff 0%, #f0e8c8 100%)",
                  border: "2px solid #D4AF37",
                  color: "#8B0000",
                  boxShadow: "2px 3px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9)",
                  fontFamily: "serif",
                }}
              >
                中
              </div>
              <div>
                <div className="font-bold tracking-widest text-base" style={{ color: "#D4AF37" }}>麻將館</div>
                <div className="text-xs tracking-wide mt-0.5" style={{ color: "#D4AF3760" }}>管理後台</div>
              </div>
            </div>
            <div className="h-px mt-4" style={{ background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
          </div>

          {/* Nav */}
          <SidebarNav />

          {/* 底部 */}
          <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid #D4AF3720" }}>
            <DailyQuote />
            <Link
              href="/"
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
            <div
              className="w-7 h-9 rounded-sm flex items-center justify-center font-bold text-sm"
              style={{
                background: "linear-gradient(150deg, #fff, #f0e8c8)",
                border: "1.5px solid #D4AF37",
                color: "#8B0000",
                boxShadow: "1px 2px 4px rgba(0,0,0,0.3)",
                fontFamily: "serif",
              }}
            >
              中
            </div>
            <span className="font-bold tracking-wider text-sm" style={{ color: "#D4AF37" }}>麻將館後台</span>
          </div>
          <Link href="/" className="text-xs" style={{ color: "#D4AF3780" }}>← 前台</Link>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav />

        {/* Main */}
        <main className="flex-1 overflow-auto md:pt-0 pt-14 pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </BadgeProvider>
  );
}
