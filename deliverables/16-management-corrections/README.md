# Deliverable 16 - Management and Correction Tools

## Objective

Implement protected, fully audited correction workflows for transactions, inventory, sales reversal, label edits, password/account controls, stock transfer, duplicate customer merge, inventory recalculation, diagnostics, backup references, and data repair.

## Control framework

Create a `CorrectionCase` with type, requester, reason, evidence, risk, source entity/version, proposed action, preview, approval policy, approver, execution result, timestamps, and status. High-risk cases require maker-checker segregation. Every tool supports preview/dry-run before execution where feasible. Repeated execution is idempotent.

## Required tools

- Sale/refund reversal through compensating stock/payment/finance entries.
- Inventory adjustment and balance recalculation from the immutable movement ledger.
- Stock transfer repair respecting dispatched/received quantities.
- Cargo label correction producing a new version.
- Duplicate customer merge using the Customer service.
- Password reset, account lock, session revocation using the RBAC service.
- Diagnostics for database, outbox/jobs, storage, sequences, reconciliation, and configuration.
- Backup/restore references and documented recovery runbook links; no arbitrary restore from the web UI.

## Permissions and acceptance

Use fine-grained `correction.*` permissions, explicit re-authentication for critical tools, approval thresholds, station scope, and reason/evidence validation.

- [ ] No tool bypasses the owning module's invariants.
- [ ] Maker cannot approve own high-risk case.
- [ ] Preview, approval, execution, failure, and reversal are audited.
- [ ] Partial execution cannot leave cross-module inconsistency.
- [ ] Diagnostics expose health without leaking secrets.
