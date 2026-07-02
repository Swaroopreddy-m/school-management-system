-- CreateTable
CREATE TABLE "SchoolUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchoolUser_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolName" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "logo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'BASIC',
    "features" TEXT NOT NULL DEFAULT 'attendance,fees,exams,library',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "School_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "SuperAdmin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_School" ("address", "city", "country", "createdAt", "createdBy", "email", "id", "logo", "phone", "schoolCode", "schoolName", "status", "timezone") SELECT "address", "city", "country", "createdAt", "createdBy", "email", "id", "logo", "phone", "schoolCode", "schoolName", "status", "timezone" FROM "School";
DROP TABLE "School";
ALTER TABLE "new_School" RENAME TO "School";
CREATE UNIQUE INDEX "School_schoolCode_key" ON "School"("schoolCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SchoolUser_schoolId_username_key" ON "SchoolUser"("schoolId", "username");
