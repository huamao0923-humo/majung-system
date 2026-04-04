import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import TenantTablesSection from "./tables-section";
import TenantTimeSlotsSection from "./timeslots-section";
import TenantAnnouncementsSection from "./announcements-section";
import BookingRulesSection from "./booking-rules-section";
import LineSettingsSection from "./line-settings-section";
import { CalendarX } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TenantSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return notFound();

  const [tables, timeSlots, announcements] = await Promise.all([
    prisma.table.findMany({ where: { tenantId: tenant.id }, orderBy: { order: "asc" } }),
    prisma.timeSlot.findMany({ where: { tenantId: tenant.id }, orderBy: { order: "asc" } }),
    prisma.announcement.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>系統設定</h1>

      {/* Booking rules */}
      <BookingRulesSection
        slug={slug}
        cancelDeadlineHours={tenant.cancelDeadlineHours}
        minAdvanceHours={tenant.minAdvanceHours}
        maxAdvanceDays={tenant.maxAdvanceDays}
      />

      {/* LINE settings */}
      <LineSettingsSection
        slug={slug}
        lineChannelId={tenant.lineChannelId}
        lineChannelSecret={tenant.lineChannelSecret}
        lineMessagingToken={tenant.lineMessagingToken}
        lineLiffId={tenant.lineLiffId}
      />

      {/* Closed dates shortcut */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #D4AF3720" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #D4AF3720" }}>
          <h2 className="font-semibold" style={{ color: "#1A0500" }}>休息日管理</h2>
        </div>
        <div className="p-5">
          <p className="text-sm mb-3" style={{ color: "rgba(139,0,0,0.55)" }}>
            設定館館休息日，休息日當天顧客無法進行線上預約。
          </p>
          <Link
            href={`/t/${slug}/admin/settings/closed-dates`}
            className="inline-flex items-center gap-2 text-sm px-5 py-2 rounded-xl font-medium transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B0000, #6B0000)", color: "#D4AF37" }}
          >
            <CalendarX className="w-4 h-4" />
            管理休息日
          </Link>
        </div>
      </div>

      <TenantTablesSection tables={tables} slug={slug} />
      <TenantTimeSlotsSection timeSlots={timeSlots} slug={slug} />
      <TenantAnnouncementsSection announcements={announcements} slug={slug} />
    </div>
  );
}
