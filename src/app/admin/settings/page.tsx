import { prisma } from "@/lib/prisma";
import TablesSection from "./tables-section";
import TimeSlotsSection from "./timeslots-section";
import AnnouncementsSection from "./announcements-section";

export default async function SettingsPage() {
  const [floors, timeSlots, announcements] = await Promise.all([
    prisma.floor.findMany({
      include: { tables: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
    prisma.timeSlot.findMany({ orderBy: { order: "asc" } }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold" style={{ color: "#1A0500" }}>系統設定</h1>
      <TablesSection floors={floors} />
      <TimeSlotsSection timeSlots={timeSlots} />
      <AnnouncementsSection announcements={announcements} />
    </div>
  );
}
