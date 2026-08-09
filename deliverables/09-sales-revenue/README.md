# Deliverable 09 - Sales and Revenue Management

## Objective

Provide reconciled daily, weekly, monthly, yearly, station, airline, officer, customer, payment-method, and business-unit sales views sourced from the posted sales ledger.

## Query model

Define canonical gross sales, net sales, discounts, tax, refunds, cancellations, amount paid, and outstanding formulas. Use sale/refund/payment status and effective dates consistently. Create reusable filter schemas and aggregation services; add materialized summaries only when measured performance requires them.

## Permissions and APIs

Use `sales.view`, `sales.view_company`, `sales.view_profit`, `sales.export`, `sales.refund`, and `sales.cancel`. Station scope and sensitive profit permission apply to all detail, aggregate, and export queries.

- `GET /api/sales`, `/api/sales/[id]`, `/api/sales/summary`, `/api/sales/trend`, `/api/sales/export`.
- Refund/cancellation endpoints delegate to POS transactional services.
- Exports run synchronously under safe limits and through queued jobs for large ranges.

## UI and acceptance

Connect Sales UI to real paginated data, server filters, drill-down transaction details, payment/refund history, receipt links, totals, comparative periods, print, PDF, Excel, and CSV exports.

- [ ] Aggregate figures reconcile exactly with underlying persisted records.
- [ ] Refund/cancellation/outstanding definitions are documented and tested.
- [ ] Exports use the same permission/filter service as the UI.
- [ ] Large export limits prevent memory exhaustion and data leakage.
