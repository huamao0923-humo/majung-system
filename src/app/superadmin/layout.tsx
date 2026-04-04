"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/superadmin", icon: LayoutDashboard, label: "儀表板" },
  { href: "/superadmin/tenants", icon: Building2, label: "租戶管理" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen" style={{ background: "#EEF2FF" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0"
        style={{
          background: "linear-gradient(180deg, #1A237E 0%, #0D1757 100%)",
          borderRight: "1px solid rgba(57,73,171,0.25)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🀄</span>
            <div>
              <div className="font-bold tracking-widest text-base" style={{ color: "#fff" }}>超級後台</div>
              <div className="text-xs tracking-wide mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>SaaS 管理系統</div>
            </div>
          </div>
          <div className="h-px mt-4" style={{ background: "linear-gradient(90deg, rgba(99,120,255,0.6), transparent)" }} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/superadmin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  active ? "font-semibold" : "hover:bg-white/5"
                )}
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, rgba(57,73,171,0.7), rgba(40,53,147,0.5))",
                        color: "#fff",
                        border: "1px solid rgba(99,120,255,0.3)",
                      }
                    : { color: "rgba(255,255,255,0.5)" }
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/superadmin/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            登出
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1A237E, #0D1757)",
          borderBottom: "1px solid rgba(99,120,255,0.2)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🀄</span>
          <span className="font-bold tracking-wider text-sm text-white">超級後台</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/superadmin/login" })}
          className="text-xs"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          登出
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid grid-cols-2"
        style={{ background: "#0D1757", borderTop: "1px solid rgba(99,120,255,0.2)" }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/superadmin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-2.5"
              style={{ color: active ? "#fff" : "rgba(255,255,255,0.35)" }}
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
