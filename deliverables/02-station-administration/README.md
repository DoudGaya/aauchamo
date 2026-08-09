# Deliverable 02 - Station Administration

## Objective

Implement the complete station lifecycle, scoped management, performance visibility, and transfer relationships without structural redevelopment when new stations are added.

## Data model

Extend `Station` with unique code, name, address, timezone, contact details, manager, status, configuration JSON, receipt/printer overrides, opening date, and version. Use `UserStationScope` and station-aware sequences. Never hard-delete a station referenced by transactions.

## Permissions and rules

Use `station.view`, `station.create`, `station.update`, `station.disable`, `station.assign_manager`, and `station.view_performance`. Only company-scoped administrators can create/disable stations. Prevent disabling a station with unresolved stock transfers, open cash sessions, or pending approvals.

## APIs and workflows

- `GET/POST /api/stations`
- `GET/PATCH /api/stations/[id]`
- `POST /api/stations/[id]/disable`
- `POST /api/stations/[id]/assign-manager`
- `GET /api/stations/[id]/performance`

All writes use optimistic concurrency, reason fields for protected changes, and audit events. Add searchable station directory, create/edit forms, manager selection, status transition dialog, station dashboard, scoped user list, and links to inventory transfers and financial performance.

## Tests and acceptance

- [ ] Code/name uniqueness and validation are enforced.
- [ ] Station scope affects every related query.
- [ ] Manager assignment and reassignment are audited.
- [ ] Disable preconditions and concurrent-update conflicts are tested.
- [ ] Adding a seeded fifth station requires data only, not code changes.
