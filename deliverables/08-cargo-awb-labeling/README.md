# Deliverable 08 - Cargo and AWB Labeling

## Objective

Implement searchable cargo/AWB records and reprintable thermal/A4 labels with barcode and QR identifiers.

## Data model

Create `CargoShipment`, `CargoParty`, `CargoStatusEvent`, and label-document links. Capture AWB/cargo number, sender/customer, receiver name/contact/address, origin/destination, weight, pieces, commodity, airline, flight number, flight/date, handling notes, declared value if enabled, station, creator, status, and version.

## Permissions and lifecycle

Use `cargo.view`, `cargo.create`, `cargo.update_draft`, `cargo.change_status`, `cargo.edit_label`, `cargo.reprint`, and `cargo.cancel`. Status flow: draft, processing, labelled, dispatched, in-transit, arrived, delivered, on-hold, cancelled. Protected label fields become immutable after dispatch unless an approved correction creates a new version. Every status and reprint is audited.

## APIs, UI, and printing

- CRUD/search endpoints plus status transition, label generation, and reprint endpoints.
- Transactional AWB numbering by station/date.
- Generate standards-compatible barcode and QR values containing a safe lookup URL/token, not sensitive payloads.
- Connect Cargo UI to real records; add sender/receiver lookup, route and airline configuration, validation, status timeline, label preview, Zebra/thermal sizing, A4 fallback, reprint count, bulk manifest export, and signed stored document access.

## Tests and acceptance

- [ ] AWB uniqueness is safe under concurrency.
- [ ] Weight/piece/date/status validations are enforced server-side.
- [ ] Labels scan correctly and reproduce persisted shipment values.
- [ ] Unauthorized users cannot edit/reprint/cross-station search cargo.
- [ ] Label versions, status events, and print events are audited.
