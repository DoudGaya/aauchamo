# Deliverable 15 - Audit Trail

## Objective

Implement an immutable, queryable audit trail for logins, product changes, sales, refunds, stock movements, price changes, user/role changes, approvals, corrections, file access, and management utilities.

## Data model and integrity

`AuditEvent` stores event ID, actor/user snapshot, action key, entity type/id/business number, station, business unit, request ID, timestamp, source IP when trusted, user agent hash/summary, reason, result, sanitized before/after or change-set JSON, previous hash, and event hash. Sensitive secrets, password hashes, full tokens, and unrestricted identity fields are never recorded.

## Service requirements

- Audit writes for protected mutations occur inside the same database transaction.
- Provide action constants and module helpers rather than free-form strings.
- Implement hash-chain verification per partition or another documented tamper-evident strategy.
- Audit records are append-only; Prisma services expose no update/delete function.
- Retention/export follows configuration without enabling ordinary deletion.

## Permissions, APIs, and UI

Use `audit.view`, `audit.view_sensitive`, `audit.export`, and company/station scope. Provide filtered list, event detail, entity timeline, actor timeline, integrity verification, and export endpoints. Connect current Audit UI to real events with safe before/after diff rendering and request correlation.

## Tests and acceptance

- [ ] Every protected workflow listed in the PRD emits an audit event.
- [ ] Mutation and audit event commit/rollback together.
- [ ] Integrity verification detects seeded tampering.
- [ ] Sensitive data redaction is tested.
- [ ] Auditor can read authorized history but cannot mutate records.
