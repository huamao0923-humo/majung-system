import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SignOutButton from "./signout-button";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const reservationCount = await prisma.reservation.count({
    where: { userId: user.id, status: "completed" },
  });

  const joinedDays = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000);
  const rounds = Math.floor(joinedDays / 30);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", borderBottom: "1px solid rgba(212,175,55,0.3)" }}
      >
        <Link href="/" className="p-1 -ml-1" style={{ color: "rgba(212,175,55,0.8)" }}>
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold" style={{ color: "#D4AF37" }}>會員資料</h1>
      </div>

      <div className="px-4 py-6 space-y-4 pb-8" style={{ background: "#FDF6E3", minHeight: "calc(100vh - 56px)" }}>
        {/* Profile card */}
        <div
          className="rounded-2xl p-6 flex items-center gap-4 shadow-sm"
          style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}
        >
          <Avatar className="w-16 h-16 flex-shrink-0">
            <AvatarImage src={user.pictureUrl ?? undefined} alt={user.displayName} />
            <AvatarFallback
              className="text-xl font-bold"
              style={{ background: "linear-gradient(135deg, rgba(139,0,0,0.12), rgba(212,175,55,0.15))", color: "#8B0000" }}
            >
              {user.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate" style={{ color: "#1A0500" }}>{user.displayName}</h2>
            {user.phone && <p className="text-sm" style={{ color: "rgba(139,0,0,0.6)" }}>{user.phone}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {user.role === "admin" && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)", color: "#D4AF37" }}
                >
                  管理員
                </span>
              )}
              {user.isBlacklisted && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#FEE2E2", color: "#991B1B" }}
                >
                  黑名單
                </span>
              )}
              {!user.isBlacklisted && user.role !== "admin" && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(212,175,55,0.12)", color: "#854D0E" }}
                >
                  一般會員
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-2xl p-4 text-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #8B0000, #5C0000)" }}
          >
            <p className="text-3xl font-bold" style={{ color: "#D4AF37" }}>{reservationCount}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(212,175,55,0.6)" }}>已完成預約</p>
          </div>
          <div
            className="rounded-2xl p-4 text-center shadow-sm"
            style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}
          >
            <p className="text-3xl font-bold" style={{ color: user.noShowCount > 0 ? "#8B0000" : "#1A0500" }}>
              {user.noShowCount}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(139,0,0,0.5)" }}>未到場次數</p>
          </div>
          <div
            className="rounded-2xl p-4 text-center shadow-sm"
            style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}
          >
            <p className="text-3xl font-bold" style={{ color: "#D4AF37" }}>{rounds}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(139,0,0,0.5)" }}>圈麻將</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(139,0,0,0.35)" }}>({joinedDays} 天前加入)</p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="rounded-2xl shadow-sm overflow-hidden"
          style={{ background: "white", border: "1px solid rgba(212,175,55,0.2)" }}
        >
          <Link
            href="/my-reservations"
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-amber-50/30"
            style={{ borderBottom: "1px solid rgba(212,175,55,0.12)" }}
          >
            <span className="text-sm font-medium" style={{ color: "#1A0500" }}>我的預約紀錄</span>
            <ChevronLeft className="w-4 h-4 rotate-180" style={{ color: "rgba(139,0,0,0.4)" }} />
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center justify-between px-5 py-4 transition-colors"
            >
              <span className="text-sm font-medium" style={{ color: "#8B0000" }}>進入管理後台</span>
              <ChevronLeft className="w-4 h-4 rotate-180" style={{ color: "rgba(139,0,0,0.4)" }} />
            </Link>
          )}
        </div>

        <SignOutButton />
      </div>
    </div>
  );
}
