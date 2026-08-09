# Deliverable 22 - Production Operations and Release

## Objective

Make the integrated ERP deployable, observable, recoverable, testable, documented, and safe across development, preview, staging/UAT, and production.

## Environments and deployment

- Create validated environment templates and separate database/storage/provider configuration per environment.
- Add Prisma migration deployment, seed restrictions, health/readiness endpoints, and controlled release/rollback documentation for Vercel.
- Document private S3 bucket policy, CORS, encryption, versioning, lifecycle, least-privilege IAM, and key organization.
- Add CI gates for install lockfile integrity, lint, typecheck, unit/integration tests, migration validation, production build, and end-to-end smoke tests.

## Testing

Build a test matrix covering authentication/RBAC, station isolation, every core CRUD workflow, stock/wallet/finance concurrency, approvals/corrections, exports/documents, files, notifications/outbox, offline idempotency, accessibility, responsive UI, and print layouts. Provide deterministic factories and an isolated integration database.

## Operations

- Structured logs with request IDs and safe actor/entity context.
- Optional Sentry instrumentation boundary and alerting guidance.
- Scheduler/job authentication, retry/dead-letter monitoring, and operational dashboards.
- Backup retention, restore steps, periodic restore validation, file recovery, incident response, secret rotation, access review, and data retention runbooks.
- Admin/user guides, API/service documentation, data-import templates, UAT checklist, and training outline.

## Final acceptance

- [ ] Fresh environment can be configured, migrated, seeded, built, and started from documentation.
- [ ] CI and all automated suites pass.
- [ ] Staging uses no production data or credentials.
- [ ] Backup restore and rollback procedures have been exercised.
- [ ] No module production path depends on seed arrays or browser-only state.
- [ ] PRD acceptance checklist has evidence and sign-off fields.
