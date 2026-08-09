# AAU Chamo Operations Suite

Production-oriented, multi-station ERP for A.A.U Chamo International Business Agency Services Limited. The application uses Next.js 16, React 19, Auth.js, PostgreSQL, Prisma, Zod, and append-only operational ledgers.

## Implemented domains

- Credentials authentication, password reset, lockout, session revocation, RBAC, elevated permissions, and station/business-unit scope.
- Live management dashboards, operational control totals, approvals, notifications, reports, global search, settings, health checks, and tamper-evident audit evidence.
- Station administration, user invitations, roles, permissions, sessions, staff/HR records, and protected customer identities with duplicate detection and merging.
- Product catalogue, suppliers, purchase orders, partial goods receipts, stock balances, scanner lookup, immutable movements, transfers, and approved adjustments.
- Station POS with server-owned prices, atomic stock/payment/finance posting, split-payment-ready contracts, outstanding balances, sales history, and controlled refunds.
- Cargo/AWB capture, status history, Code 128 labels, secure QR tracking, controlled reprints, agent wallets, finance cashbook, and flight bookings.

The implementation contracts and per-module build prompts are in [`deliverables/`](./deliverables/README.md).

## Local setup

Requirements: Node.js 20+, pnpm/npm, and PostgreSQL 15+.

```powershell
Copy-Item .env.example .env.local
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Local seed accounts are listed in `prisma/seed.ts`; they share `SEED_SUPER_ADMIN_PASSWORD` and must change it at first sign-in. Never run the demo seed against production.

## Production release

1. Store `DATABASE_URL`, `DIRECT_DATABASE_URL`, a random 32+ character `AUTH_SECRET`, and a base64-encoded 32-byte `DATA_ENCRYPTION_KEY` in the deployment secret manager.
2. Configure private S3-compatible storage and notification providers when those adapters are enabled. Do not expose server secrets with a `NEXT_PUBLIC_` prefix.
3. Apply the checked-in migration with `npm run db:deploy`. It creates the full schema plus database triggers that prevent mutation/deletion of audit, stock-movement, wallet-entry, and print-event ledgers and protect posted cashbook fields.
4. Run the release gates below, deploy the build artifact, and verify `/api/health` from the platform readiness probe.
5. Create the first production administrator through a controlled bootstrap process; do not use the demo seed credentials.

```powershell
npm run db:validate
npm run typecheck
npm run lint
npm test
npm run build
```

## Operational guarantees

- All protected API reads and mutations authenticate on the server and apply granular permission plus station scope.
- Financial values use PostgreSQL/Prisma decimals. Stock, wallet, payment, refund, and finance changes commit transactionally.
- Posted records are reversed with compensating entries; evidentiary ledgers are append-only.
- Mutation inputs use Zod and return a consistent request-correlated JSON envelope.
- Sensitive customer/staff values use authenticated encryption, audit payloads redact secrets, and audit events form a SHA-256 chain serialized under a database advisory lock.
- Cargo tracking exposes only limited shipment state through an HMAC-signed token.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:deploy` | Apply production migrations |
| `npm run db:seed` | Load local/demo fixtures only |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm test` | Run the automated contract/security tests |
| `npm run build` | Produce the optimized Next.js build |

No live database is bundled with the repository. Migration and seed execution require the target environment's PostgreSQL connection.
