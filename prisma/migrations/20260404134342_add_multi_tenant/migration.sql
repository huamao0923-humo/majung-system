/*
  Warnings:

  - Added the required column `tenantId` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floorId` to the `Table` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Table` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `WaitlistEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lineChannelId" TEXT,
    "lineChannelSecret" TEXT,
    "lineMessagingToken" TEXT,
    "lineLiffId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Floor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Announcement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Announcement" ("content", "createdAt", "id", "isActive", "title", "updatedAt") SELECT "content", "createdAt", "id", "isActive", "title", "updatedAt" FROM "Announcement";
DROP TABLE "Announcement";
ALTER TABLE "new_Announcement" RENAME TO "Announcement";
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reservationId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "paidAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "confirmedBy", "createdAt", "id", "method", "note", "paidAt", "reservationId", "status") SELECT "amount", "confirmedBy", "createdAt", "id", "method", "note", "paidAt", "reservationId", "status" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_reservationId_key" ON "Payment"("reservationId");
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("checkedInAt", "createdAt", "date", "guestCount", "id", "note", "status", "tableId", "timeSlotId", "updatedAt", "userId") SELECT "checkedInAt", "createdAt", "date", "guestCount", "id", "note", "status", "tableId", "timeSlotId", "updatedAt", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE TABLE "new_Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "posX" REAL NOT NULL DEFAULT 10,
    "posY" REAL NOT NULL DEFAULT 10,
    "tableWidth" REAL NOT NULL DEFAULT 22,
    "tableHeight" REAL NOT NULL DEFAULT 14,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Table_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Table_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Table" ("capacity", "id", "isActive", "name", "order") SELECT "capacity", "id", "isActive", "name", "order" FROM "Table";
DROP TABLE "Table";
ALTER TABLE "new_Table" RENAME TO "Table";
CREATE TABLE "new_TimeSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TimeSlot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TimeSlot" ("endTime", "id", "isActive", "name", "order", "price", "startTime") SELECT "endTime", "id", "isActive", "name", "order", "price", "startTime" FROM "TimeSlot";
DROP TABLE "TimeSlot";
ALTER TABLE "new_TimeSlot" RENAME TO "TimeSlot";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "pictureUrl" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "displayName", "id", "isBlacklisted", "lineUserId", "noShowCount", "phone", "pictureUrl", "role") SELECT "createdAt", "displayName", "id", "isBlacklisted", "lineUserId", "noShowCount", "phone", "pictureUrl", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_tenantId_lineUserId_key" ON "User"("tenantId", "lineUserId");
CREATE TABLE "new_WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaitlistEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WaitlistEntry" ("createdAt", "date", "guestCount", "id", "notified", "timeSlotId", "userId") SELECT "createdAt", "date", "guestCount", "id", "notified", "timeSlotId", "userId" FROM "WaitlistEntry";
DROP TABLE "WaitlistEntry";
ALTER TABLE "new_WaitlistEntry" RENAME TO "WaitlistEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_username_key" ON "SuperAdmin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
