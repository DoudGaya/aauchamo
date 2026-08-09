# Deliverable 06 - Purchase and Inventory

## Objective

Implement the authoritative product catalogue, supplier purchasing, per-station stock balances, and immutable movement ledger for stock-in, stock-out, transfer, adjustment, damage, return, and reconciliation.

## Data model

Create `Product`, `ProductCategory`, `UnitOfMeasure`, `Supplier`, `PurchaseOrder`, `PurchaseOrderLine`, `GoodsReceipt`, `GoodsReceiptLine`, `InventoryBalance`, `StockMovement`, `StockTransfer`, `StockTransferLine`, `InventoryAdjustment`, `Batch`, and optional `ExpiryLot`. Products include unique code, barcode/QR value, category, supplier defaults, purchase/selling prices, unit, minimum/reorder levels, batch/expiry controls, status, and version.

`StockMovement` is append-only. `InventoryBalance` is updated only inside the same database transaction as the movement. Quantities use precise decimals where units permit fractions. Enforce a unique balance per product/station/batch dimension.

## Permissions and business rules

Use `inventory.view`, `inventory.create_product`, `inventory.update_product`, `inventory.stock_in`, `inventory.stock_out`, `inventory.transfer`, `inventory.adjust`, `inventory.approve_adjustment`, `inventory.view_cost`, and purchase permissions. Prevent negative stock unless a company setting explicitly permits it. Price changes, adjustments, damage, and returns require reasons and audit events. Transfers use requested, dispatched, received, rejected, and cancelled states; source stock changes on dispatch and destination stock changes on receipt.

## APIs and services

- Product, category, supplier, purchase-order, goods-receipt, balance, movement, transfer, and adjustment CRUD/query endpoints.
- Barcode lookup endpoint optimized for POS scanners.
- Transactional inventory service with row/version locking and idempotency keys.
- Reorder query and purchase recommendation service.

## UI and documents

Connect Inventory and Purchases screens to real data. Implement catalogue forms, barcode generation, supplier directory, PO workflow, partial goods receipt, stock-in/out, transfer wizard, receive/reject flow, adjustment approval, batch/expiry filters, movement history, valuation, low-stock alerts, CSV import/export, and printable inventory/PO documents.

## Tests and acceptance

- [ ] Concurrent stock mutations cannot oversell or corrupt balances.
- [ ] Every balance reconciles exactly to its movement ledger.
- [ ] Transfers never duplicate or lose stock across stations.
- [ ] Cost visibility and station scope are enforced server-side.
- [ ] Low-stock/out-of-stock notifications are emitted transactionally.
- [ ] All prototype product arrays are removed from production paths.
