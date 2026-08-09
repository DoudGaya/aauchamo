# Deliverable 12 - Reporting and Analytics

## Objective

Deliver role-aware operational and management reports by station, user, product, agent, customer, airline, date, and business unit with consistent KPIs and PDF/Excel/CSV output.

## Architecture

Create a report registry where each report defines permission, validated filters, columns, query/service, totals, export formats, maximum synchronous range, and print template. Create `SavedReport`, `ReportRun`, and `ScheduledReport` records. Reports must call canonical module query services rather than reimplementing financial or inventory formulas.

## Required reports

At minimum: consolidated sales, station sales, payment mix, refunds/cancellations/outstanding, inventory valuation, stock movement, low stock, purchase history, cargo manifest/status, customer history, agent performance/wallet reconciliation, cashbook, income/expense, profit/station revenue, staff directory, user activity, and audit access review.

## APIs and UI

- Report catalogue, filter metadata, run/status/download, save/schedule, and recent-run endpoints.
- Queue large report generation through the outbox/job abstraction and store output privately.
- Connect Reports UI to live catalogue, filter forms, run progress, preview, saved reports, scheduling, and protected downloads.

## Tests and acceptance

- [ ] Every report permission and station filter is enforced in its server query and export.
- [ ] Totals reconcile with source module tests.
- [ ] Large ranges queue safely; repeated identical requests are idempotent where appropriate.
- [ ] PDF, Excel, and CSV outputs preserve types, labels, timezone, and filters.
