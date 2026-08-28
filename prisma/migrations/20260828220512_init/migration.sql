-- AlterTable
ALTER TABLE "cargo_shipments" ADD COLUMN     "isFragile" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "logoDarkObjectKey" TEXT;

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "passportObjectKey" TEXT;

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clockInAt" TIMESTAMPTZ(3) NOT NULL,
    "clockOutAt" TIMESTAMPTZ(3),
    "clockInLatitude" DOUBLE PRECISION,
    "clockInLongitude" DOUBLE PRECISION,
    "clockOutLatitude" DOUBLE PRECISION,
    "clockOutLongitude" DOUBLE PRECISION,
    "clockInIp" TEXT,
    "clockOutIp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_locations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cargo_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_attendance_companyId_date_idx" ON "staff_attendance"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_staffId_date_key" ON "staff_attendance"("staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_locations_companyId_code_key" ON "cargo_locations"("companyId", "code");

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_locations" ADD CONSTRAINT "cargo_locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
