# Deliverable 11 - Financial Management

## Objective

Implement daily income and expenses, cashbook, agent deposits, wallet transactions, refunds, profit reporting, sales summaries, station revenue, approvals, and controlled reversals without expanding into a full statutory general ledger.

## Data model

Create `FinancialAccount`, `CashbookEntry`, `IncomeEntry`, `ExpenseEntry`, `CashSession`, `Reconciliation`, `RefundPosting`, and `FinancialPeriod`. All postings contain immutable amount/direction, account/category, station, business unit, reference/source, payment method, status, actor, approval/reversal linkage, and timestamps.

## Controls

Use `finance.view`, `finance.post_income`, `finance.post_expense`, `finance.approve`, `finance.reconcile`, `finance.reverse`, `finance.view_profit`, and company/station scope. Posting and reversal are transactional and idempotent. Expense thresholds and sensitive refunds require approval. Closed periods reject ordinary postings. Cashbook totals derive from posted entries only.

## APIs and UI

- Account/category setup, cashbook list/summary, income/expense creation, approval, reconciliation, period close/reopen, reversal, profit/station revenue, and export endpoints.
- Connect Finance UI to real accounts and entries. Add record-entry dialogs, approval evidence, reconciliation workspace, source-document attachment, reversal reason, cash-session count, station/profit views, and print/export.

## Tests and acceptance

- [ ] Every integrated POS/wallet/refund event posts exactly once.
- [ ] Cashbook opening + movements = closing for every scope.
- [ ] Approval segregation, period locks, reversals, and station scope are tested.
- [ ] Profit formula and exclusions are documented and reconcile to source data.
- [ ] No posted financial entry can be silently edited/deleted.
