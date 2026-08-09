# Deliverable 18 - Global Search

## Objective

Implement fast permission-aware search across customers, agents, products, receipts, labels, staff, stations, users, transactions, PNR, and AWB number.

## Architecture

Create a search service with typed result groups and module-owned search adapters. Prefer indexed PostgreSQL queries and normalized exact/prefix search for identifiers/phones, with approved full-text/trigram indexing for names and descriptions. Do not create a data-leaking global denormalized index unless its authorization model is proven.

## Permissions and behavior

Every adapter receives authenticated user permissions and station scope before querying. Sensitive fields are never included solely to improve search. Limit query length, result count, execution time, and per-group results. Log performance metadata, not raw sensitive searches.

## API and UI

- `GET /api/search?q=...&types=...` returning grouped results, permitted module, display metadata, and safe destination.
- Optional exact identifier lookup for barcode/AWB/PNR/receipt paths.
- Connect the existing command search to debounced live API results, keyboard navigation, recent permitted modules, loading/error/empty states, and deep links.

## Tests and acceptance

- [ ] Cross-station and cross-permission result leakage tests pass for every adapter.
- [ ] Exact codes/phone/PNR/AWB searches use indexes.
- [ ] Search remains bounded for one-character, wildcard-like, and abusive input.
- [ ] Prototype arrays are removed from command search.
