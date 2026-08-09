# Deliverable 01 - Executive and Operational Dashboards

## Objective

Replace dashboard fixtures with live, permission-aware KPIs for consolidated management, each business unit, and each authorized station.

## Dependencies

Platform foundation, stations, sales, inventory, cargo, agents, finance, staff, approvals, and audit event sources. Implement query contracts early; activate each metric when its source module lands.

## Permissions

`dashboard.view`, `dashboard.view_financial`, `dashboard.view_company`, and station scope. Hide sensitive profit/wallet data unless explicitly permitted, but enforce the same restriction in every query.

## Server implementation

- Create a dashboard query service returning gross/net revenue, transaction counts, inventory value, stock exceptions, active customers/agents/staff/stations, outstanding payments, cargo state, pending approvals, and recent audited activity.
- Support `from`, `to`, `stationIds`, and `businessUnitIds` with validated maximum ranges.
- Use database aggregation rather than loading rows into application memory.
- Define metric formulas centrally and add reconciliation tests against source ledgers.
- Add cache tags or short-lived caching with correct invalidation after relevant writes.

## APIs and UI

- `GET /api/dashboard/summary`
- `GET /api/dashboard/revenue-trend`
- `GET /api/dashboard/station-performance`
- `GET /api/dashboard/attention`

Connect the existing overview and live-operations UI to these endpoints or server queries. Provide loading, empty, partial-data, error, print, station filter, business-unit filter, and date-range states. Business-unit dashboards must include Binani, UMZA, Logistics, Ticketing, and future units without code duplication.

## Tests and acceptance

- [ ] KPI formulas reconcile to seeded sales, refunds, inventory, and finance ledgers.
- [ ] Station users cannot infer other-station metrics.
- [ ] Financial KPI masking works.
- [ ] Date boundaries and timezone behavior are tested.
- [ ] Dashboard contains no production-path mock values.
- [ ] P95 query targets and cache invalidation are verified.
