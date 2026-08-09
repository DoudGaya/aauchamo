# Deliverable 04 - Staff and HR Records

## Objective

Implement protected staff and employment records with station assignments, photos, documents, status history, and optional next-of-kin data.

## Data model

Create `Staff`, `Department`, `Position`, `EmploymentHistory`, `StaffStationAssignment`, `NextOfKin`, and attachment relationships. Fields include staff ID, legal/preferred name, phone/email/address, salary decimal, employment date, employment type, status, passport photo, department, position, station, and version.

## Permissions and privacy

Use `staff.view`, `staff.create`, `staff.update`, `staff.change_status`, `staff.view_sensitive`, and `staff.manage_documents`. Salary, national ID, address, and next-of-kin are masked or excluded unless `staff.view_sensitive` is granted. HR access does not grant finance access.

## APIs and workflows

- `GET/POST /api/staff`, `GET/PATCH /api/staff/[id]`.
- `POST /api/staff/[id]/status`, `/assign-station`, and signed file upload/download flows.
- Search, filters, paginated directory, profile page, employment timeline, station reassignment, status transition with effective date/reason, photo/document upload, and safe CSV import template.

## Tests and acceptance

- [ ] Staff ID uniqueness and required employment data are enforced.
- [ ] Sensitive fields never appear in unauthorized API payloads, exports, logs, or search.
- [ ] Status/station history is immutable and audited.
- [ ] Private files require permission-checked signed access.
- [ ] Current Staff UI uses the backend and supports desktop/mobile forms.
