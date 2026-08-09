# Deliverable 19 - System Configuration

## Objective

Implement versioned configuration for company identity/logo, receipt footer, tax, payment methods, business units, stations, permissions, printers, notification adapters, thresholds, and operational policies.

## Data model

Use normalized tables for `Company`, `BusinessUnit`, `PaymentMethod`, `TaxRule`, `PrinterProfile`, and notification templates/providers. Use `SystemSetting` only for validated, non-secret settings that do not justify a table. Secrets remain in environment/secret managers and are referenced by adapter identifiers, never stored in ordinary JSON settings.

## Permissions and rules

Use granular `settings.*` permissions. Changes are versioned and audited. Critical changes such as tax rules, numbering, negative stock, approval thresholds, and provider activation require reasons and optionally approval. Effective-dated configuration prevents retroactive changes to posted transactions.

## APIs and UI

Provide typed get/update endpoints per configuration section, logo upload, payment/business-unit lifecycle, tax rule effective dates, printer test output, provider connection tests, and configuration export without secrets. Connect current Configuration UI to real values and implement validation, dirty-state handling, concurrency conflict messages, and restart-required indicators where applicable.

## Tests and acceptance

- [ ] Invalid or unknown configuration keys cannot be persisted.
- [ ] Effective-dated rules do not alter historical transactions.
- [ ] Secrets never appear in responses or configuration exports.
- [ ] Configuration changes invalidate relevant caches and emit audit events.
