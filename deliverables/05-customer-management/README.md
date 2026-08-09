# Deliverable 05 - Customer Management

## Objective

Implement reusable customer identities required before sales, cargo, and ticketing, with history, duplicate detection, and controlled merge tools.

## Data model

Create `Customer`, `CustomerContact`, `CustomerIdentifier`, `CustomerMerge`, and links from sales, cargo, bookings, agents where relevant. Capture name/company, normalized phone, optional email, PNR context, optional national ID, destination, airline, remarks, customer type, home station, status, and version.

## Permissions and rules

Use `customer.view`, `customer.create`, `customer.update`, `customer.view_history`, `customer.merge`, and `customer.view_sensitive`. Search and duplicate candidates respect station/company scope. National ID is masked unless sensitive access is granted.

## APIs and workflows

- `GET/POST /api/customers`, `GET/PATCH /api/customers/[id]`.
- `GET /api/customers/[id]/history`.
- `GET /api/customers/duplicates` and `POST /api/customers/merge`.
- Provide fast lookup by phone/name/email/PNR, create-with-duplicate-warning, profile and cross-module history, protected edits, duplicate comparison, merge preview, and transactional merge preserving all foreign-key history.

## Tests and acceptance

- [ ] Normalization and duplicate scoring are deterministic.
- [ ] POS/cargo/booking cannot reference an unauthorized or disabled customer.
- [ ] Merge is transactional, reversible by controlled recovery, and fully audited.
- [ ] Sensitive identifiers are excluded from ordinary exports/search results.
- [ ] Current customer and POS selectors use real server search.
