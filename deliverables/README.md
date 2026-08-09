# AAU Chamo ERP - Implementation Deliverables

This directory converts the approved PRD into implementation contracts. Each module README is both a build prompt and a completion checklist. Read a module completely before changing code, satisfy its dependencies, implement every required server and client behavior, run its tests, and update its status here only when the acceptance checklist is complete.

## Non-negotiable engineering rules

- Authentication, authorization, permission checks, and station scope are enforced on the server for every query and mutation.
- PostgreSQL is the production system of record. Prisma transactions protect stock, wallet, payment, refund, and financial invariants.
- All incoming data is validated with Zod. API failures use one typed error envelope and never leak secrets or stack traces.
- Financial amounts use database decimals or integer minor units, never JavaScript floating-point arithmetic for persisted calculations.
- Sensitive changes create immutable audit events containing actor, station, action, entity, before/after metadata, timestamp, and request context.
- Posted financial and inventory events are reversed with compensating entries; they are not silently edited or hard-deleted.
- IDs use stable CUID/UUID primary keys plus human-readable, collision-safe business numbers generated transactionally.
- Timestamps are stored in UTC and displayed in the user or company timezone. Soft deletion/status transitions are preferred for regulated records.
- Files remain private. The database stores metadata and ownership; downloads use permission-checked, short-lived signed URLs.
- Server code lives outside client component graphs. Secrets never use `NEXT_PUBLIC_` variables.
- Every module includes happy-path, validation, authorization, station-isolation, concurrency, and audit tests.

## Shared API contract

Successful API response:

```json
{ "data": {}, "meta": { "requestId": "..." } }
```

Failed API response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be completed.",
    "fieldErrors": {},
    "requestId": "..."
  }
}
```

List endpoints support `page`, `pageSize`, `sort`, `q`, `stationId`, `from`, `to`, and module-specific filters. Maximum page sizes and export limits are enforced server-side.

## Implementation order and status

| Order | Deliverable | PRD module | Status |
|---:|---|---:|---|
| 0 | [Platform foundation](./00-platform-foundation/README.md) | Shared | Implemented; build verified |
| 1 | [Executive and operational dashboards](./01-executive-dashboards/README.md) | 1 | Implemented; build verified |
| 2 | [Station administration](./02-station-administration/README.md) | 2 | Implemented; build verified |
| 3 | [User access and RBAC](./03-user-access-rbac/README.md) | 3 | Implemented; build verified |
| 4 | [Staff and HR records](./04-staff-hr/README.md) | 4 | Implemented; build verified |
| 5 | [Customer management](./05-customer-management/README.md) | 5 | Implemented; build verified |
| 6 | [Purchase and inventory](./06-purchase-inventory/README.md) | 6 | Implemented; build verified |
| 7 | [Point of sale](./07-point-of-sale/README.md) | 7 | Implemented; build verified |
| 8 | [Cargo and AWB labeling](./08-cargo-awb-labeling/README.md) | 8 | Implemented; build verified |
| 9 | [Sales and revenue](./09-sales-revenue/README.md) | 9 | Implemented; build verified |
| 10 | [Agents and wallets](./10-agents-wallets/README.md) | 10 | Implemented; build verified |
| 11 | [Financial management](./11-financial-management/README.md) | 11 | Implemented; build verified |
| 12 | [Reporting and analytics](./12-reporting-analytics/README.md) | 12 | Implemented; build verified |
| 13 | [Printing and documents](./13-printing-documents/README.md) | 13 | Implemented; build verified |
| 14 | [Notifications](./14-notifications/README.md) | 14 | Implemented; build verified |
| 15 | [Audit trail](./15-audit-trail/README.md) | 15 | Implemented; build verified |
| 16 | [Management and correction tools](./16-management-corrections/README.md) | 16 | Implemented; build verified |
| 17 | [Security controls](./17-security-controls/README.md) | 17 | Implemented; build verified |
| 18 | [Global search](./18-global-search/README.md) | 18 | Implemented; build verified |
| 19 | [System configuration](./19-system-configuration/README.md) | 19 | Implemented; build verified |
| 20 | [Advanced and future-ready features](./20-advanced-future-ready/README.md) | 20 | Implemented; build verified |
| 21 | [Flight ticket booking](./21-flight-ticket-booking/README.md) | 21 | Implemented; build verified |
| 22 | [Production operations and release](./22-production-operations/README.md) | Shared | Release-ready; environment deployment pending |

## Definition of complete

A module is complete only when its schema and migration exist, seed fixtures are present, server services and APIs enforce access rules, the approved UI uses real server data, all mutations are transactional and audited, exports/printing work where required, tests pass, documentation is updated, and no mock array remains in the production path for that module.

“Build verified” records the repository-level Prisma validation, TypeScript, ESLint, automated-test, and optimized Next.js build gates. Applying the migration, seeding an isolated environment, exercising provider adapters, and running database-backed concurrency/scope acceptance tests remain deployment-environment release steps because this workspace has no live PostgreSQL connection.
