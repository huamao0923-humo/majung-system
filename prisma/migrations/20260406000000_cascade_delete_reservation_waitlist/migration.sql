-- DropForeignKey: Reservation
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_userId_fkey";
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_tableId_fkey";
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_timeSlotId_fkey";

-- DropForeignKey: WaitlistEntry
ALTER TABLE "WaitlistEntry" DROP CONSTRAINT "WaitlistEntry_userId_fkey";
ALTER TABLE "WaitlistEntry" DROP CONSTRAINT "WaitlistEntry_timeSlotId_fkey";

-- AddForeignKey: Reservation (with CASCADE)
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey"
  FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_timeSlotId_fkey"
  FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: WaitlistEntry (with CASCADE)
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_timeSlotId_fkey"
  FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
