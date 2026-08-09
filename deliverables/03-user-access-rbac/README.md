# Deliverable 03 - User Access and RBAC

## Objective

Implement secure account lifecycle management and granular database-backed authorization for Super Admin, Admin, Finance, HR, Operations Manager, Sales Officer, Operations Coordinator, Customer Service, Auditor, and custom roles.

## Data and security model

Use `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `UserStationScope`, `Session`, `LoginAttempt`, and `PasswordResetToken`. Store normalized email/username uniqueness, password hash, account state, lock timestamps, last login, failed count, and security version. Permissions use stable keys such as `inventory.adjust` rather than UI labels.

## Required workflows

- Administrator creates/invites users, assigns role(s) and station scope, activates/deactivates accounts, locks/unlocks accounts, resets passwords, revokes sessions, and reviews recent access.
- Credentials login supports username or email, constant-time password verification, generic failure messaging, failed-attempt recording, configurable lockout, and disabled-account denial.
- Password reset tokens are hashed, single-use, expiring, and revoke prior sessions after successful reset.
- Role/permission changes take effect immediately through session security-version checks.

## APIs

- Auth.js handlers under `/api/auth/*`.
- `GET/POST /api/users`, `GET/PATCH /api/users/[id]`.
- `POST /api/users/[id]/activate|deactivate|lock|unlock|reset-password|revoke-sessions`.
- `GET/POST /api/roles`, `GET/PATCH /api/roles/[id]`, permission matrix endpoints.

## UI and tests

Connect the current user-access cards to real users, roles, permissions, station scope, and sessions. Add login/reset screens, invite/create wizard, role editor, permission matrix, active-session viewer, and protected confirmations.

- [ ] All listed roles seed with an approved baseline permission matrix.
- [ ] Custom roles work without code changes.
- [ ] Direct API calls cannot bypass role or station rules.
- [ ] Lockout, reset, revocation, and role-change invalidation are tested.
- [ ] Auditor remains read-only even if a mutation UI is manually invoked.
