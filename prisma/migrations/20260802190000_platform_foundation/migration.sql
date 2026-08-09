-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_INVITE', 'ACTIVE', 'LOCKED', 'DISABLED');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('COMPANY', 'BUSINESS_UNIT', 'STATION');

-- CreateEnum
CREATE TYPE "LoginAttemptResult" AS ENUM ('SUCCESS', 'INVALID_CREDENTIALS', 'LOCKED', 'DISABLED', 'RATE_LIMITED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditOutcome" AS ENUM ('SUCCESS', 'DENIED', 'FAILURE');

-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('PENDING_UPLOAD', 'ACTIVE', 'QUARANTINED', 'DELETED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'SECRET_REFERENCE');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'POS_TERMINAL', 'BANK_TRANSFER', 'WALLET', 'CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'TEMPORARY', 'INTERN', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED', 'RETIRED');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'DISABLED', 'MERGED');

-- CreateEnum
CREATE TYPE "CustomerContactType" AS ENUM ('PHONE', 'EMAIL', 'ADDRESS');

-- CreateEnum
CREATE TYPE "CustomerIdentifierType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'TAX_ID', 'PNR', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DISCONTINUED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('OPENING', 'PURCHASE_RECEIPT', 'SALE', 'SALE_RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'DAMAGE', 'RETURN_TO_SUPPLIER', 'REVERSAL');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('REQUESTED', 'DISPATCHED', 'RECEIVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('HELD', 'POSTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING_APPROVAL', 'POSTED', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "CargoStatus" AS ENUM ('DRAFT', 'PROCESSING', 'LABELLED', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WalletEntryType" AS ENUM ('DEPOSIT', 'SALE_DEBIT', 'REFUND_CREDIT', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "FinanceDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "PostingStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'POSTED', 'RECONCILED', 'REVERSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('RESERVED', 'TICKETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('GENERATING', 'READY', 'FAILED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "logoObjectKey" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "currencyCode" TEXT NOT NULL DEFAULT 'NGN',
    "locale" TEXT NOT NULL DEFAULT 'en-NG',
    "taxRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_units" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "business_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'NG',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "status" "StationStatus" NOT NULL DEFAULT 'ACTIVE',
    "openedAt" DATE,
    "disabledAt" TIMESTAMPTZ(3),
    "disabledReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_business_units" (
    "stationId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_business_units_pkey" PRIMARY KEY ("stationId","businessUnitId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMPTZ(3),
    "phone" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "passwordChangedAt" TIMESTAMPTZ(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_INVITE',
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(3),
    "lastLoginAt" TIMESTAMPTZ(3),
    "lastLoginIp" TEXT,
    "securityVersion" INTEGER NOT NULL DEFAULT 1,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecretCipher" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL,
    "securityVersion" INTEGER NOT NULL DEFAULT 1,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    "expires" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "RoleScope" NOT NULL DEFAULT 'STATION',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "stationId" TEXT,
    "businessUnitId" TEXT,
    "validFrom" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMPTZ(3),
    "assignedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_station_scopes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canOperate" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_station_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_business_unit_scopes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canOperate" BOOLEAN NOT NULL DEFAULT false,
    "assignedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_business_unit_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_manager_assignments" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMPTZ(3),
    "assignedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_manager_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifier" TEXT NOT NULL,
    "result" "LoginAttemptResult" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequences" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT,
    "businessUnitId" TEXT,
    "scopeKey" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL DEFAULT '',
    "prefix" TEXT NOT NULL,
    "nextValue" BIGINT NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 6,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorId" TEXT,
    "stationId" TEXT,
    "businessUnitId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "outcome" "AuditOutcome" NOT NULL DEFAULT 'SUCCESS',
    "reason" TEXT,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "previousHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT,
    "businessUnitId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedRoleKey" TEXT,
    "decidedById" TEXT,
    "requestReason" TEXT NOT NULL,
    "decisionReason" TEXT,
    "payload" JSONB,
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT,
    "businessUnitId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "encryptionKeyId" TEXT,
    "status" "AttachmentStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "uploadedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "stationId" TEXT,
    "businessUnitId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "readAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "quietFrom" TEXT,
    "quietTo" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT,
    "businessUnitId" TEXT,
    "scopeKey" TEXT NOT NULL DEFAULT 'COMPANY',
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueType" "SettingValueType" NOT NULL DEFAULT 'JSON',
    "value" JSONB NOT NULL,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMPTZ(3),
    "lockedBy" TEXT,
    "publishedAt" TIMESTAMPTZ(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'PROCESSING',
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "requiresReference" BOOLEAN NOT NULL DEFAULT false,
    "requiresTerminal" BOOLEAN NOT NULL DEFAULT false,
    "allowsChange" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "userId" TEXT,
    "staffNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "nationalIdCiphertext" TEXT,
    "salary" DECIMAL(18,2),
    "employmentDate" DATE NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "departmentId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "homeStationId" TEXT NOT NULL,
    "passportAttachmentId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_history" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "previousStatus" "StaffStatus",
    "newStatus" "StaffStatus" NOT NULL,
    "effectiveAt" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "previousDetails" JSONB,
    "newDetails" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_station_assignments" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" DATE NOT NULL,
    "endsAt" DATE,
    "reason" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_station_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "next_of_kin" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "next_of_kin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "homeStationId" TEXT NOT NULL,
    "customerNumber" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "displayName" TEXT NOT NULL,
    "primaryPhone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "primaryEmail" TEXT,
    "normalizedEmail" TEXT,
    "defaultPnr" TEXT,
    "defaultDestination" TEXT,
    "defaultAirline" TEXT,
    "nationalIdCiphertext" TEXT,
    "remarks" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "mergedIntoId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerContactType" NOT NULL,
    "label" TEXT,
    "value" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_identifiers" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerIdentifierType" NOT NULL,
    "valueCiphertext" TEXT NOT NULL,
    "valueHash" TEXT NOT NULL,
    "lastFour" TEXT,
    "expiresAt" DATE,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_merges" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceCustomerId" TEXT NOT NULL,
    "targetCustomerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "mergedById" TEXT NOT NULL,
    "mergedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMPTZ(3),
    "restoredById" TEXT,

    CONSTRAINT "customer_merges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units_of_measure" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "paymentTerms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "defaultSupplierId" TEXT,
    "code" TEXT NOT NULL,
    "barcode" TEXT,
    "qrValue" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purchasePrice" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "sellingPrice" DECIMAL(18,2) NOT NULL,
    "taxRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "minimumLevel" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "trackBatches" BOOLEAN NOT NULL DEFAULT false,
    "trackExpiry" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "manufacturedAt" DATE,
    "expiresAt" DATE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balances" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "batchKey" TEXT NOT NULL DEFAULT '',
    "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "movementType" "StockMovementType" NOT NULL,
    "quantityDelta" DECIMAL(18,3) NOT NULL,
    "balanceAfter" DECIMAL(18,3) NOT NULL,
    "unitCost" DECIMAL(18,2),
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "reason" TEXT,
    "occurredById" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedById" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "supplierId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATE,
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityOrdered" DECIMAL(18,3) NOT NULL,
    "quantityReceived" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "taxRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "supplierRef" TEXT,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'DRAFT',
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT NOT NULL,
    "postedAt" TIMESTAMPTZ(3),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_lines" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "purchaseOrderLineId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unitCost" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "goods_receipt_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "originStationId" TEXT NOT NULL,
    "destinationStationId" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedById" TEXT,
    "dispatchedAt" TIMESTAMPTZ(3),
    "receivedById" TEXT,
    "receivedAt" TIMESTAMPTZ(3),
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_lines" (
    "id" TEXT NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantityRequested" DECIMAL(18,3) NOT NULL,
    "quantityDispatched" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "quantityReceived" DECIMAL(18,3) NOT NULL DEFAULT 0,

    CONSTRAINT "stock_transfer_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_adjustments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "adjustmentNumber" TEXT NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "postedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_adjustment_lines" (
    "id" TEXT NOT NULL,
    "inventoryAdjustmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "expectedQuantity" DECIMAL(18,3) NOT NULL,
    "countedQuantity" DECIMAL(18,3) NOT NULL,
    "quantityDelta" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "inventory_adjustment_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_sessions" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "openedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingCash" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
    "closedById" TEXT,
    "closedAt" TIMESTAMPTZ(3),
    "expectedCash" DECIMAL(18,2),
    "countedCash" DECIMAL(18,2),
    "variance" DECIMAL(18,2),

    CONSTRAINT "pos_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT,
    "posSessionId" TEXT,
    "saleNumber" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'POSTED',
    "subtotal" DECIMAL(18,2) NOT NULL,
    "taxTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "paidTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstandingTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "officerId" TEXT NOT NULL,
    "postedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMPTZ(3),
    "cancellationReason" TEXT,
    "reversedSaleId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_lines" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "unitCode" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "costPrice" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "quantityRefunded" DECIMAL(18,3) NOT NULL DEFAULT 0,

    CONSTRAINT "sale_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "customerId" TEXT,
    "paymentMethodId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reference" TEXT,
    "terminalId" TEXT,
    "receivedById" TEXT NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMPTZ(3),
    "reversalReason" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outstanding_payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "original" DECIMAL(18,2) NOT NULL,
    "outstanding" DECIMAL(18,2) NOT NULL,
    "dueAt" DATE,
    "settledAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "outstanding_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'POSTED',
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "returnToStock" BOOLEAN NOT NULL DEFAULT true,
    "paymentReference" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "postedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_lines" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "saleLineId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "refund_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_shipments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "awbNumber" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "receiverAddress" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "weightKg" DECIMAL(12,3) NOT NULL,
    "pieces" INTEGER NOT NULL,
    "commodity" TEXT NOT NULL,
    "airline" TEXT,
    "flightNumber" TEXT,
    "flightDate" DATE,
    "handlingNotes" TEXT,
    "declaredValue" DECIMAL(18,2),
    "status" "CargoStatus" NOT NULL DEFAULT 'DRAFT',
    "labelVersion" INTEGER NOT NULL DEFAULT 1,
    "reprintCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cargo_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_status_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "previousStatus" "CargoStatus",
    "status" "CargoStatus" NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "changedById" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "homeStationId" TEXT NOT NULL,
    "customerId" TEXT,
    "agentNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "creditLimit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_accounts" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "walletAccountId" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "entryNumber" TEXT NOT NULL,
    "type" "WalletEntryType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "externalRef" TEXT,
    "reason" TEXT,
    "postedById" TEXT NOT NULL,
    "reversedEntryId" TEXT,
    "postedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinanceDirection" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashbook_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "entryNumber" TEXT NOT NULL,
    "direction" "FinanceDirection" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalReference" TEXT,
    "status" "PostingStatus" NOT NULL DEFAULT 'POSTED',
    "postedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "postedAt" TIMESTAMPTZ(3),
    "reversalOfId" TEXT,
    "reversalReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashbook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_periods" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" DATE NOT NULL,
    "endsAt" DATE NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedById" TEXT,
    "closedAt" TIMESTAMPTZ(3),

    CONSTRAINT "financial_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "openedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingBalance" DECIMAL(18,2) NOT NULL,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
    "closedById" TEXT,
    "closedAt" TIMESTAMPTZ(3),
    "expected" DECIMAL(18,2),
    "counted" DECIMAL(18,2),
    "variance" DECIMAL(18,2),

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "statementDate" DATE NOT NULL,
    "statementBalance" DECIMAL(18,2) NOT NULL,
    "systemBalance" DECIMAL(18,2) NOT NULL,
    "difference" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL,
    "reconciledById" TEXT NOT NULL,
    "reconciledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_bookings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT,
    "bookingNumber" TEXT NOT NULL,
    "pnr" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT,
    "travelDate" DATE NOT NULL,
    "fare" DECIMAL(18,2) NOT NULL,
    "sellingPrice" DECIMAL(18,2) NOT NULL,
    "profit" DECIMAL(18,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'RESERVED',
    "createdById" TEXT NOT NULL,
    "ticketedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ticket_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stationId" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'GENERATING',
    "objectKey" TEXT,
    "mimeType" TEXT,
    "checksum" TEXT,
    "generatedById" TEXT NOT NULL,
    "generatedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_events" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "printedById" TEXT NOT NULL,
    "printerName" TEXT,
    "format" TEXT NOT NULL,
    "reason" TEXT,
    "printedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE INDEX "business_units_companyId_isActive_idx" ON "business_units"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "business_units_companyId_code_key" ON "business_units"("companyId", "code");

-- CreateIndex
CREATE INDEX "stations_companyId_status_idx" ON "stations"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stations_companyId_code_key" ON "stations"("companyId", "code");

-- CreateIndex
CREATE INDEX "station_business_units_businessUnitId_idx" ON "station_business_units"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_status_idx" ON "users"("companyId", "status");

-- CreateIndex
CREATE INDEX "users_companyId_lastName_firstName_idx" ON "users"("companyId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_revokedAt_expires_idx" ON "sessions"("userId", "revokedAt", "expires");

-- CreateIndex
CREATE INDEX "verification_tokens_token_expires_idx" ON "verification_tokens"("token", "expires");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "roles_companyId_isActive_idx" ON "roles"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "roles_companyId_code_key" ON "roles"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_module_action_idx" ON "permissions"("module", "action");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "user_roles_userId_validUntil_idx" ON "user_roles"("userId", "validUntil");

-- CreateIndex
CREATE INDEX "user_roles_stationId_idx" ON "user_roles"("stationId");

-- CreateIndex
CREATE INDEX "user_roles_businessUnitId_idx" ON "user_roles"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_stationId_businessUnitId_key" ON "user_roles"("userId", "roleId", "stationId", "businessUnitId");

-- CreateIndex
CREATE INDEX "user_station_scopes_stationId_canOperate_idx" ON "user_station_scopes"("stationId", "canOperate");

-- CreateIndex
CREATE UNIQUE INDEX "user_station_scopes_userId_stationId_key" ON "user_station_scopes"("userId", "stationId");

-- CreateIndex
CREATE INDEX "user_business_unit_scopes_businessUnitId_canOperate_idx" ON "user_business_unit_scopes"("businessUnitId", "canOperate");

-- CreateIndex
CREATE UNIQUE INDEX "user_business_unit_scopes_userId_businessUnitId_key" ON "user_business_unit_scopes"("userId", "businessUnitId");

-- CreateIndex
CREATE INDEX "station_manager_assignments_stationId_endsAt_idx" ON "station_manager_assignments"("stationId", "endsAt");

-- CreateIndex
CREATE INDEX "station_manager_assignments_managerId_idx" ON "station_manager_assignments"("managerId");

-- CreateIndex
CREATE INDEX "login_attempts_identifier_occurredAt_idx" ON "login_attempts"("identifier", "occurredAt");

-- CreateIndex
CREATE INDEX "login_attempts_ipAddress_occurredAt_idx" ON "login_attempts"("ipAddress", "occurredAt");

-- CreateIndex
CREATE INDEX "sequences_stationId_documentType_idx" ON "sequences"("stationId", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "sequences_companyId_scopeKey_documentType_dateKey_key" ON "sequences"("companyId", "scopeKey", "documentType", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "audit_events_eventHash_key" ON "audit_events"("eventHash");

-- CreateIndex
CREATE INDEX "audit_events_companyId_occurredAt_idx" ON "audit_events"("companyId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_events_actorId_occurredAt_idx" ON "audit_events"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_occurredAt_idx" ON "audit_events"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_events_stationId_occurredAt_idx" ON "audit_events"("stationId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_events_companyId_eventHash_idx" ON "audit_events"("companyId", "eventHash");

-- CreateIndex
CREATE INDEX "approval_requests_companyId_status_requestedAt_idx" ON "approval_requests"("companyId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "approval_requests_assignedToId_status_idx" ON "approval_requests"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "approval_requests_entityType_entityId_idx" ON "approval_requests"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_objectKey_key" ON "attachments"("objectKey");

-- CreateIndex
CREATE INDEX "attachments_recordType_recordId_idx" ON "attachments"("recordType", "recordId");

-- CreateIndex
CREATE INDEX "attachments_companyId_module_createdAt_idx" ON "attachments"("companyId", "module", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_status_createdAt_idx" ON "notifications"("recipientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_companyId_type_createdAt_idx" ON "notifications"("companyId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_type_channel_key" ON "notification_preferences"("userId", "type", "channel");

-- CreateIndex
CREATE INDEX "system_settings_stationId_namespace_idx" ON "system_settings"("stationId", "namespace");

-- CreateIndex
CREATE INDEX "system_settings_businessUnitId_namespace_idx" ON "system_settings"("businessUnitId", "namespace");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_companyId_scopeKey_namespace_key_key" ON "system_settings"("companyId", "scopeKey", "namespace", "key");

-- CreateIndex
CREATE INDEX "outbox_events_status_availableAt_idx" ON "outbox_events"("status", "availableAt");

-- CreateIndex
CREATE INDEX "outbox_events_aggregateType_aggregateId_idx" ON "outbox_events"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_companyId_route_key_key" ON "idempotency_keys"("companyId", "route", "key");

-- CreateIndex
CREATE INDEX "payment_methods_companyId_isActive_displayOrder_idx" ON "payment_methods"("companyId", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_companyId_code_key" ON "payment_methods"("companyId", "code");

-- CreateIndex
CREATE INDEX "departments_companyId_isActive_idx" ON "departments"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_code_key" ON "departments"("companyId", "code");

-- CreateIndex
CREATE INDEX "positions_companyId_isActive_idx" ON "positions"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "positions_companyId_code_key" ON "positions"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "staff_userId_key" ON "staff"("userId");

-- CreateIndex
CREATE INDEX "staff_companyId_status_lastName_firstName_idx" ON "staff"("companyId", "status", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "staff_homeStationId_status_idx" ON "staff"("homeStationId", "status");

-- CreateIndex
CREATE INDEX "staff_departmentId_idx" ON "staff"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_companyId_staffNumber_key" ON "staff"("companyId", "staffNumber");

-- CreateIndex
CREATE INDEX "employment_history_staffId_effectiveAt_idx" ON "employment_history"("staffId", "effectiveAt");

-- CreateIndex
CREATE INDEX "staff_station_assignments_staffId_endsAt_idx" ON "staff_station_assignments"("staffId", "endsAt");

-- CreateIndex
CREATE INDEX "staff_station_assignments_stationId_endsAt_idx" ON "staff_station_assignments"("stationId", "endsAt");

-- CreateIndex
CREATE INDEX "next_of_kin_staffId_idx" ON "next_of_kin"("staffId");

-- CreateIndex
CREATE INDEX "customers_companyId_normalizedPhone_idx" ON "customers"("companyId", "normalizedPhone");

-- CreateIndex
CREATE INDEX "customers_companyId_normalizedEmail_idx" ON "customers"("companyId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "customers_companyId_displayName_idx" ON "customers"("companyId", "displayName");

-- CreateIndex
CREATE INDEX "customers_homeStationId_status_idx" ON "customers"("homeStationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "customers_companyId_customerNumber_key" ON "customers"("companyId", "customerNumber");

-- CreateIndex
CREATE INDEX "customer_contacts_type_normalized_idx" ON "customer_contacts"("type", "normalized");

-- CreateIndex
CREATE UNIQUE INDEX "customer_contacts_customerId_type_normalized_key" ON "customer_contacts"("customerId", "type", "normalized");

-- CreateIndex
CREATE INDEX "customer_identifiers_type_valueHash_idx" ON "customer_identifiers"("type", "valueHash");

-- CreateIndex
CREATE UNIQUE INDEX "customer_identifiers_customerId_type_valueHash_key" ON "customer_identifiers"("customerId", "type", "valueHash");

-- CreateIndex
CREATE INDEX "customer_merges_companyId_mergedAt_idx" ON "customer_merges"("companyId", "mergedAt");

-- CreateIndex
CREATE INDEX "customer_merges_sourceCustomerId_idx" ON "customer_merges"("sourceCustomerId");

-- CreateIndex
CREATE INDEX "customer_merges_targetCustomerId_idx" ON "customer_merges"("targetCustomerId");

-- CreateIndex
CREATE INDEX "product_categories_companyId_isActive_idx" ON "product_categories"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_companyId_code_key" ON "product_categories"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_companyId_code_key" ON "units_of_measure"("companyId", "code");

-- CreateIndex
CREATE INDEX "suppliers_companyId_name_idx" ON "suppliers"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_supplierNumber_key" ON "suppliers"("companyId", "supplierNumber");

-- CreateIndex
CREATE INDEX "products_companyId_name_status_idx" ON "products"("companyId", "name", "status");

-- CreateIndex
CREATE UNIQUE INDEX "products_companyId_code_key" ON "products"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "products_companyId_barcode_key" ON "products"("companyId", "barcode");

-- CreateIndex
CREATE INDEX "batches_expiresAt_idx" ON "batches"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "batches_productId_code_key" ON "batches"("productId", "code");

-- CreateIndex
CREATE INDEX "inventory_balances_productId_stationId_idx" ON "inventory_balances"("productId", "stationId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balances_stationId_productId_batchKey_key" ON "inventory_balances"("stationId", "productId", "batchKey");

-- CreateIndex
CREATE INDEX "stock_movements_stationId_productId_occurredAt_idx" ON "stock_movements"("stationId", "productId", "occurredAt");

-- CreateIndex
CREATE INDEX "stock_movements_referenceType_referenceId_idx" ON "stock_movements"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "purchase_orders_stationId_status_orderDate_idx" ON "purchase_orders"("stationId", "status", "orderDate");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_companyId_orderNumber_key" ON "purchase_orders"("companyId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_lines_purchaseOrderId_productId_key" ON "purchase_order_lines"("purchaseOrderId", "productId");

-- CreateIndex
CREATE INDEX "goods_receipts_purchaseOrderId_status_idx" ON "goods_receipts"("purchaseOrderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_companyId_receiptNumber_key" ON "goods_receipts"("companyId", "receiptNumber");

-- CreateIndex
CREATE INDEX "goods_receipt_lines_goodsReceiptId_idx" ON "goods_receipt_lines"("goodsReceiptId");

-- CreateIndex
CREATE INDEX "stock_transfers_originStationId_status_requestedAt_idx" ON "stock_transfers"("originStationId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "stock_transfers_destinationStationId_status_requestedAt_idx" ON "stock_transfers"("destinationStationId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_companyId_transferNumber_key" ON "stock_transfers"("companyId", "transferNumber");

-- CreateIndex
CREATE INDEX "stock_transfer_lines_stockTransferId_idx" ON "stock_transfer_lines"("stockTransferId");

-- CreateIndex
CREATE INDEX "inventory_adjustments_stationId_status_requestedAt_idx" ON "inventory_adjustments"("stationId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_adjustments_companyId_adjustmentNumber_key" ON "inventory_adjustments"("companyId", "adjustmentNumber");

-- CreateIndex
CREATE INDEX "inventory_adjustment_lines_inventoryAdjustmentId_idx" ON "inventory_adjustment_lines"("inventoryAdjustmentId");

-- CreateIndex
CREATE INDEX "pos_sessions_stationId_status_openedAt_idx" ON "pos_sessions"("stationId", "status", "openedAt");

-- CreateIndex
CREATE INDEX "sales_stationId_postedAt_status_idx" ON "sales"("stationId", "postedAt", "status");

-- CreateIndex
CREATE INDEX "sales_customerId_postedAt_idx" ON "sales"("customerId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sales_companyId_saleNumber_key" ON "sales"("companyId", "saleNumber");

-- CreateIndex
CREATE INDEX "sale_lines_saleId_idx" ON "sale_lines"("saleId");

-- CreateIndex
CREATE INDEX "payments_stationId_receivedAt_idx" ON "payments"("stationId", "receivedAt");

-- CreateIndex
CREATE INDEX "payments_reference_idx" ON "payments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_companyId_paymentNumber_key" ON "payments"("companyId", "paymentNumber");

-- CreateIndex
CREATE INDEX "payment_allocations_saleId_idx" ON "payment_allocations"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocations_paymentId_saleId_key" ON "payment_allocations"("paymentId", "saleId");

-- CreateIndex
CREATE UNIQUE INDEX "outstanding_payments_saleId_key" ON "outstanding_payments"("saleId");

-- CreateIndex
CREATE INDEX "outstanding_payments_outstanding_dueAt_idx" ON "outstanding_payments"("outstanding", "dueAt");

-- CreateIndex
CREATE INDEX "refunds_saleId_status_idx" ON "refunds"("saleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_companyId_refundNumber_key" ON "refunds"("companyId", "refundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "refund_lines_refundId_saleLineId_key" ON "refund_lines"("refundId", "saleLineId");

-- CreateIndex
CREATE INDEX "cargo_shipments_stationId_status_createdAt_idx" ON "cargo_shipments"("stationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "cargo_shipments_customerId_createdAt_idx" ON "cargo_shipments"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_shipments_companyId_awbNumber_key" ON "cargo_shipments"("companyId", "awbNumber");

-- CreateIndex
CREATE INDEX "cargo_status_events_shipmentId_occurredAt_idx" ON "cargo_status_events"("shipmentId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "agents_customerId_key" ON "agents"("customerId");

-- CreateIndex
CREATE INDEX "agents_companyId_name_status_idx" ON "agents"("companyId", "name", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agents_companyId_agentNumber_key" ON "agents"("companyId", "agentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_accounts_agentId_key" ON "wallet_accounts"("agentId");

-- CreateIndex
CREATE INDEX "wallet_entries_walletAccountId_postedAt_idx" ON "wallet_entries"("walletAccountId", "postedAt");

-- CreateIndex
CREATE INDEX "wallet_entries_referenceType_referenceId_idx" ON "wallet_entries"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_entries_companyId_entryNumber_key" ON "wallet_entries"("companyId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "financial_accounts_companyId_code_key" ON "financial_accounts"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "financial_categories_companyId_code_key" ON "financial_categories"("companyId", "code");

-- CreateIndex
CREATE INDEX "cashbook_entries_stationId_status_createdAt_idx" ON "cashbook_entries"("stationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "cashbook_entries_accountId_postedAt_idx" ON "cashbook_entries"("accountId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cashbook_entries_companyId_entryNumber_key" ON "cashbook_entries"("companyId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "cashbook_entries_companyId_sourceType_sourceId_direction_ac_key" ON "cashbook_entries"("companyId", "sourceType", "sourceId", "direction", "accountId");

-- CreateIndex
CREATE INDEX "financial_periods_companyId_isClosed_idx" ON "financial_periods"("companyId", "isClosed");

-- CreateIndex
CREATE UNIQUE INDEX "financial_periods_companyId_startsAt_endsAt_key" ON "financial_periods"("companyId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "cash_sessions_stationId_status_openedAt_idx" ON "cash_sessions"("stationId", "status", "openedAt");

-- CreateIndex
CREATE INDEX "reconciliations_accountId_statementDate_idx" ON "reconciliations"("accountId", "statementDate");

-- CreateIndex
CREATE INDEX "ticket_bookings_companyId_pnr_idx" ON "ticket_bookings"("companyId", "pnr");

-- CreateIndex
CREATE INDEX "ticket_bookings_stationId_travelDate_status_idx" ON "ticket_bookings"("stationId", "travelDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_bookings_companyId_bookingNumber_key" ON "ticket_bookings"("companyId", "bookingNumber");

-- CreateIndex
CREATE INDEX "generated_documents_sourceType_sourceId_idx" ON "generated_documents"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_documents_companyId_documentNumber_version_key" ON "generated_documents"("companyId", "documentNumber", "version");

-- CreateIndex
CREATE INDEX "print_events_documentId_printedAt_idx" ON "print_events"("documentId", "printedAt");

-- AddForeignKey
ALTER TABLE "business_units" ADD CONSTRAINT "business_units_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_business_units" ADD CONSTRAINT "station_business_units_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_business_units" ADD CONSTRAINT "station_business_units_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_station_scopes" ADD CONSTRAINT "user_station_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_station_scopes" ADD CONSTRAINT "user_station_scopes_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_business_unit_scopes" ADD CONSTRAINT "user_business_unit_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_business_unit_scopes" ADD CONSTRAINT "user_business_unit_scopes_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_manager_assignments" ADD CONSTRAINT "station_manager_assignments_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_manager_assignments" ADD CONSTRAINT "station_manager_assignments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_homeStationId_fkey" FOREIGN KEY ("homeStationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_history" ADD CONSTRAINT "employment_history_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_station_assignments" ADD CONSTRAINT "staff_station_assignments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_station_assignments" ADD CONSTRAINT "staff_station_assignments_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "next_of_kin" ADD CONSTRAINT "next_of_kin_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_homeStationId_fkey" FOREIGN KEY ("homeStationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_identifiers" ADD CONSTRAINT "customer_identifiers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_merges" ADD CONSTRAINT "customer_merges_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_merges" ADD CONSTRAINT "customer_merges_sourceCustomerId_fkey" FOREIGN KEY ("sourceCustomerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_merges" ADD CONSTRAINT "customer_merges_targetCustomerId_fkey" FOREIGN KEY ("targetCustomerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units_of_measure" ADD CONSTRAINT "units_of_measure_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_defaultSupplierId_fkey" FOREIGN KEY ("defaultSupplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "purchase_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_originStationId_fkey" FOREIGN KEY ("originStationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destinationStationId_fkey" FOREIGN KEY ("destinationStationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustment_lines" ADD CONSTRAINT "inventory_adjustment_lines_inventoryAdjustmentId_fkey" FOREIGN KEY ("inventoryAdjustmentId") REFERENCES "inventory_adjustments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_adjustment_lines" ADD CONSTRAINT "inventory_adjustment_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_posSessionId_fkey" FOREIGN KEY ("posSessionId") REFERENCES "pos_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_reversedSaleId_fkey" FOREIGN KEY ("reversedSaleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outstanding_payments" ADD CONSTRAINT "outstanding_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_lines" ADD CONSTRAINT "refund_lines_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "refunds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_lines" ADD CONSTRAINT "refund_lines_saleLineId_fkey" FOREIGN KEY ("saleLineId") REFERENCES "sale_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_lines" ADD CONSTRAINT "refund_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_shipments" ADD CONSTRAINT "cargo_shipments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_shipments" ADD CONSTRAINT "cargo_shipments_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_shipments" ADD CONSTRAINT "cargo_shipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_status_events" ADD CONSTRAINT "cargo_status_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "cargo_shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_homeStationId_fkey" FOREIGN KEY ("homeStationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_walletAccountId_fkey" FOREIGN KEY ("walletAccountId") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_reversedEntryId_fkey" FOREIGN KEY ("reversedEntryId") REFERENCES "wallet_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_entries" ADD CONSTRAINT "cashbook_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_entries" ADD CONSTRAINT "cashbook_entries_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_entries" ADD CONSTRAINT "cashbook_entries_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_entries" ADD CONSTRAINT "cashbook_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_entries" ADD CONSTRAINT "cashbook_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_entries" ADD CONSTRAINT "cashbook_entries_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_entries" ADD CONSTRAINT "cashbook_entries_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "cashbook_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_periods" ADD CONSTRAINT "financial_periods_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_bookings" ADD CONSTRAINT "ticket_bookings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_bookings" ADD CONSTRAINT "ticket_bookings_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_bookings" ADD CONSTRAINT "ticket_bookings_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_bookings" ADD CONSTRAINT "ticket_bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_bookings" ADD CONSTRAINT "ticket_bookings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_events" ADD CONSTRAINT "print_events_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "generated_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Database-enforced immutability for evidentiary and posting ledgers.
CREATE OR REPLACE FUNCTION reject_append_only_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; % is not permitted', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE TRIGGER stock_movements_append_only
BEFORE UPDATE OR DELETE ON "stock_movements"
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE TRIGGER wallet_entries_append_only
BEFORE UPDATE OR DELETE ON "wallet_entries"
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE TRIGGER print_events_append_only
BEFORE UPDATE OR DELETE ON "print_events"
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE OR REPLACE FUNCTION protect_posted_cashbook_entry()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'cashbook_entries cannot be deleted; use a compensating reversal';
  END IF;
  IF OLD.status IN ('POSTED', 'RECONCILED', 'REVERSED') AND (
    NEW."companyId" IS DISTINCT FROM OLD."companyId" OR
    NEW."stationId" IS DISTINCT FROM OLD."stationId" OR
    NEW."businessUnitId" IS DISTINCT FROM OLD."businessUnitId" OR
    NEW."accountId" IS DISTINCT FROM OLD."accountId" OR
    NEW."categoryId" IS DISTINCT FROM OLD."categoryId" OR
    NEW."paymentMethodId" IS DISTINCT FROM OLD."paymentMethodId" OR
    NEW.direction IS DISTINCT FROM OLD.direction OR
    NEW.amount IS DISTINCT FROM OLD.amount OR
    NEW."sourceType" IS DISTINCT FROM OLD."sourceType" OR
    NEW."sourceId" IS DISTINCT FROM OLD."sourceId"
  ) THEN
    RAISE EXCEPTION 'posted cashbook financial fields are immutable; use a compensating reversal';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cashbook_entries_protect_posted
BEFORE UPDATE OR DELETE ON "cashbook_entries"
FOR EACH ROW EXECUTE FUNCTION protect_posted_cashbook_entry();
