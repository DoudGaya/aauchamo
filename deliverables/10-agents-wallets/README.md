# Deliverable 10 - Agent Management and Wallets

## Objective

Implement agent profiles, credit limits, opening balances, deposits, immutable wallet credits/debits, outstanding exposure, statements, and finance/admin oversight.

## Data model

Create `Agent`, `AgentContact`, `AgentWallet`, `WalletTransaction`, `AgentDeposit`, and `CreditLimitHistory`. One wallet per configured currency/agent. Wallet transactions are append-only and contain type, amount, balance-after snapshot, source module/entity, idempotency key, actor, station, status, and reversal linkage.

## Financial invariants and permissions

Use `agent.view`, `agent.create`, `agent.update`, `wallet.view`, `wallet.deposit`, `wallet.debit`, `wallet.adjust`, `wallet.change_credit_limit`, and `wallet.export`. Lock wallet rows/version during posting. Deposit approval and reference uniqueness follow configuration. Prevent spending beyond balance plus approved credit. Opening balances are special audited transactions. Corrections use reversals.

## APIs and UI

- Agent CRUD/search/history and wallet balance/ledger/statement endpoints.
- Deposit, controlled credit/debit, reversal, credit-limit update, and statement export commands.
- Connect Agent UI to live balances and utilization; add profile forms, deposit verification, ledger timeline, credit exposure, statements, low-balance alerts, transaction source links, and print/export.

## Tests and acceptance

- [ ] Concurrent debits cannot exceed permitted exposure.
- [ ] Stored wallet balance reconciles to immutable ledger entries.
- [ ] Duplicate deposit references/idempotency keys cannot double-credit.
- [ ] Credit-limit history and every financial action are audited.
- [ ] Statements reproduce opening, movement, and closing balances exactly.
