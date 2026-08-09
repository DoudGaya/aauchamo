# Deliverable 00 - Platform Foundation

## Objective

Build the secure shared platform required by every ERP module. Replace prototype-only state with a production relational data layer, authenticated request context, typed service boundaries, station scoping, audit primitives, deterministic numbering, and test infrastructure.

## Required implementation

### Runtime and packages

- Configure Prisma with PostgreSQL for production and a documented isolated test database strategy.
- Add Auth.js credentials authentication, secure password hashing, encrypted JWT sessions, database-backed session grants, account status checks, security-version invalidation, and active revocation. Auth.js credentials require JWT sessions; the database grant is the authoritative revocation and device/session record.
- Add Zod schemas, structured logging, request IDs, rate limiting abstractions, and server-only module boundaries.
- Provide `.env.example` with validation at boot for database, auth, application URL, S3, email/SMS, and optional monitoring variables.

### Core schema

Create shared models and enums for `Company`, `BusinessUnit`, `Station`, `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `UserStationScope`, `Session`, `VerificationToken`, `Sequence`, `AuditEvent`, `ApprovalRequest`, `Attachment`, `Notification`, `SystemSetting`, and `OutboxEvent`.

Every mutable business model must include creation/update timestamps, creator/updater identifiers where appropriate, status, station/business-unit ownership, and optimistic-concurrency or version information for sensitive records.

### Server architecture

- `lib/db`: singleton Prisma client with safe development reuse.
- `lib/auth`: Auth.js configuration, credential validation, session enrichment, password helpers, login-attempt policy, and server helpers.
- `lib/access`: `requireSession`, `requirePermission`, station-scope builders, sensitive-field masking, and role/permission constants.
- `lib/api`: typed success/error responses, Zod parsing, pagination, request IDs, and safe exception mapping.
- `lib/audit`: transaction-aware audit writer; audit failures must roll back protected mutations.
- `lib/sequence`: transactional human-readable number allocation per entity/station/date.
- `lib/money`, `lib/time`, `lib/idempotency`, and `lib/outbox` primitives.

### Application structure

Create separate authenticated and public route groups. Add `/login`, `/forgot-password`, `/reset-password`, `/unauthorized`, and protected ERP layout. Move the current ERP shell behind authentication and provide real session, permission, and station data to it from a Server Component.

### Seed and developer experience

Seed the company, business units, four stations, default roles, granular permissions, one super-admin account, representative scoped users, payment methods, and demo operational data. Print development credentials only when explicitly running the seed command; never expose them in the UI or production build.

## Tests

- Environment validation and database connectivity.
- Password hashing/verification and disabled-account rejection.
- Session creation, expiry, revocation, and role-change invalidation.
- Permission and station-scope isolation across service and API layers.
- Transactional sequence uniqueness under concurrent requests.
- Audit writer rollback behavior.
- API validation/error-envelope contract.

## Acceptance checklist

- [ ] PostgreSQL/Prisma migrations and repeatable seed succeed.
- [ ] Unauthenticated users cannot access ERP routes or APIs.
- [ ] Permission and station scope are enforced server-side.
- [ ] Login, logout, reset, lockout, session expiry, and revocation work.
- [ ] Shared services are documented and tested.
- [ ] Current UI reads its identity/stations from the authenticated backend.
- [ ] `lint`, typecheck, unit, integration, and production build pass.
