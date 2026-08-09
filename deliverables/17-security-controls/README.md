# Deliverable 17 - Security Controls

## Objective

Harden authentication, authorization, sessions, inputs, sensitive data, files, secrets, environments, monitoring, backup, and recovery to the PRD security baseline.

## Required controls

- Strong password policy, modern adaptive hashing, reset tokens, session expiry, rotation/revocation, account disabling, login monitoring, lockout, and optional 2FA-ready challenge models.
- Central authorization and station scope at services and APIs; never rely on hidden menus.
- Zod validation, safe query construction, output encoding, upload allowlists, request/body limits, and CSRF/origin protections appropriate to Auth.js/Next.js.
- Field masking and minimum-data responses for salary, national ID, wallet, finance, and personal records.
- Secure cookies, HTTPS assumptions, security headers, CSP, frame restrictions, referrer policy, and environment-specific configuration.
- Private S3 access, short-lived signatures, checksum/type/size validation, and least-privilege cloud identities.
- Secret validation/rotation documentation, separate environments, sanitized logs, rate-limit adapters, health checks, monitoring hooks, backups, and restore-test runbooks.

## Verification

Create automated authorization matrix tests, station data-isolation tests, rate-limit tests, session invalidation tests, upload abuse tests, security-header checks, dependency audit workflow, and a production security checklist.

## Acceptance checklist

- [ ] All sensitive mutations recheck authorization on the server.
- [ ] Sessions cannot survive disabled accounts or security-version changes.
- [ ] Secrets/sensitive fields do not appear in client bundles, errors, logs, audits, or ordinary exports.
- [ ] Security headers and cookie attributes are verified in production build.
- [ ] Backup and recovery procedures have executable validation steps.
