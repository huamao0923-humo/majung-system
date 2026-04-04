import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineMessage, waitlistAvailableMessage } from "@/lib/line";
import { formatDate } from "@/lib/date";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { notified } = body;

  const entry = await prisma.waitlistEntry.findUnique({
    where: { id },
    include: {
      user: { select: { lineUserId: true, displayName: true } },
      timeSlot: { select: { name: true } },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "候補記錄不存在" }, { status: 404 });
  }

  const updated = await prisma.waitlistEntry.update({
    where: { id },
    data: { notified: Boolean(notified) },
  });

  // Send LINE push if marking as notified
  if (notified && !entry.notified) {
    try {
      await sendLineMessage(entry.user.lineUserId, [
        waitlistAvailableMessage({
          displayName: entry.user.displayName,
          date: formatDate(entry.date),
          timeSlotName: entry.timeSlot.name,
        }),
      ]);
    } catch (err) {
      console.error("[LINE] 候補通知推播失敗:", err);
    }
  }

  return NextResponse.json(updated);
}
