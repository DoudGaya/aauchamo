# Deliverable 07 - Point of Sale

## Objective

Implement a fast, station-scoped POS that searches/scans products, requires a customer, optionally selects an agent, controls discounts, accepts multiple payment methods, posts inventory and financial entries, and generates numbered receipts/invoices.

## Data model

Create `Sale`, `SaleLine`, `Payment`, `PaymentAllocation`, `Discount`, `Refund`, `RefundLine`, `POSSession`, and `OutstandingPayment`. A sale stores business number, customer, optional agent, station, business unit, officer, subtotal, tax, discount, total, paid, outstanding, status, timestamps, and version. Lines snapshot product name/code/unit/price/tax at sale time.

## Transaction rules

Posting a sale must atomically allocate its business number, verify permissions/station/product availability/prices, create lines and payments, reduce stock through movements, update outstanding balances, post finance/outbox events, and write audit evidence. Idempotency prevents double posting. Discounts above configured thresholds require permission or approval. Posted sales are cancelled/reversed, never deleted. Refunds reference original lines, enforce remaining refundable quantity/value, return stock when configured, and post compensating financial entries.

## APIs and UI

- Product scan/search, customer/agent search, quote/price validation, create sale, retrieve receipt, hold/resume, cancel, refund, and outstanding-payment endpoints.
- Connect the existing POS cart to backend product/customer data and server-calculated totals.
- Support cash, POS, bank transfer, wallet, and split payments. Add terminal/reference fields, payment validation, held carts, receipt choice, keyboard/scanner shortcuts, offline queue eligibility, and safe retry behavior.

## Tests and acceptance

- [ ] Client cannot override authoritative price, tax, stock, discount, or total.
- [ ] Sale, stock, payment, finance, and audit entries commit or roll back together.
- [ ] Duplicate requests create one sale only.
- [ ] Refund/cancellation permissions, limits, approvals, and reversals are tested.
- [ ] Numbered thermal/A4 receipt is reproducible from persisted snapshots.
- [ ] POS uses no mock cart posting path.
