# Deliverable 21 - Flight Ticket Booking

## Objective

Implement internal flight booking records for customers, PNR, airline, route, travel date, passengers, contacts, fare, service charge, payment/status, ticket documents, receipts, profit, and future GDS readiness.

## Data model

Create `FlightBooking`, `Passenger`, `BookingSegment`, `BookingPayment`, and document links. Persist PNR, customer, passenger/contact snapshots, airline, origin/destination, travel dates/times, booking/ticket status, currency, base fare, taxes, service charge, total, paid, outstanding, cost, calculated profit, station, officer, agent if applicable, external-provider reference, and version.

## Permissions and rules

Use `booking.view`, `booking.create`, `booking.update_draft`, `booking.ticket`, `booking.cancel`, `booking.refund`, `booking.view_profit`, and station scope. PNR uniqueness is scoped appropriately. Fare/profit calculations are server-side. Ticketed bookings use controlled cancellation/refund flows. Live issuance is not claimed until a contracted provider adapter is configured.

## APIs and UI

- Booking CRUD/search/detail, status transition, payment, document upload/download, receipt, cancellation/refund, and profit endpoints.
- Connect Flight Bookings UI to real data; add customer/passenger selection, multi-segment form, payment/outstanding flow, status timeline, itinerary/ticket upload, receipt, profitability view, and PNR search.

## Tests and acceptance

- [ ] Fare + taxes + service charge = total; profit formula is tested.
- [ ] Payment/outstanding amounts reconcile with finance entries.
- [ ] Ticket documents are private and permission checked.
- [ ] Manual workflow clearly distinguishes internal record from external airline issuance.
- [ ] Future GDS adapter interface is documented and covered by contract tests.
