# Deliverable 14 - Notifications

## Objective

Implement durable in-app alerts for low stock, low agent balance, large transactions, user creation, failed logins, pending approvals, and inventory adjustments, with provider-ready email/SMS delivery.

## Data model and architecture

Use `Notification`, `NotificationRecipient`, `NotificationPreference`, `NotificationTemplate`, `OutboxEvent`, and `DeliveryAttempt`. Domain services emit transactional outbox events; a worker transforms them into deduplicated notifications and provider deliveries. Persist retry count, next attempt, response metadata, and terminal status without storing provider secrets.

## Rules and permissions

Users only read their notifications. Administrators with `notification.manage` configure templates/thresholds/providers. Preferences cannot disable mandatory security notifications. Deduplication keys suppress repeated threshold noise while allowing state-change notifications.

## APIs and UI

- Notification list/unread count/read/read-all endpoints.
- Preference and admin-template endpoints.
- Background processing endpoint/job with authenticated scheduler access.
- Connect bell popover and notification centre to live data with pagination, filtering, real unread markers, deep links, and delivery preferences.

## Tests and acceptance

- [ ] Domain transaction and outbox event commit atomically.
- [ ] Retries and provider failures never duplicate user-facing notifications.
- [ ] Mandatory security alerts ignore ordinary opt-out.
- [ ] Deep links respect destination permissions and station scope.
- [ ] Email/SMS adapters can be replaced without changing domain services.
