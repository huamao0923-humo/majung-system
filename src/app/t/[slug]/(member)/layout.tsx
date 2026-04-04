"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Home, CalendarPlus, CalendarDays, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TenantMemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const navItems = [
    { href: `/t/${slug}`, icon: Home, label: "首頁" },
    { href: `/t/${slug}/reserve`, icon: CalendarPlus, label: "預約" },
    { href: `/t/${slug}/my-reservations`, icon: CalendarDays, label: "我的預約" },
    { href: `/t/${slug}/profile`, icon: User, label: "會員" },
  ];

  return (
    <div className="min-h-screen pb-20">
      {children}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "linear-gradient(180deg, #FFFBF0, #FDF6E3)",
          borderTop: "1px solid #D4AF3740",
          boxShadow: "0 -4px 20px #8B000015",
        }}
      >
        <div className="grid grid-cols-4 max-w-lg mx-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 py-3 text-xs transition-all duration-200"
                style={{ color: active ? "#8B0000" : "#9CA3AF" }}
              >
                {active && (
                  <div
                    className="absolute h-[2px] w-10 -mt-3 rounded-full"
                    style={{ background: "linear-gradient(90deg, transparent, #8B0000, transparent)" }}
                  />
                )}
                <div className="relative">
                  <Icon
                    className={cn("w-5 h-5 transition-all", active && "scale-110")}
                    style={{ strokeWidth: active ? 2.5 : 1.8 }}
                  />
                  {active && (
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "#D4AF37" }}
                    />
                  )}
                </div>
                <span
                  className="font-medium"
                  style={{ fontSize: "11px", color: active ? "#8B0000" : "#9CA3AF" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
