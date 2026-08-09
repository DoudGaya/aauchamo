# Deliverable 13 - Printing and Documents

## Objective

Generate, store, retrieve, and reprint receipts, invoices, cargo labels, agent statements, sales reports, and inventory reports for thermal and A4 printers.

## Architecture and data

Use shared `Attachment`, `DocumentTemplate`, `GeneratedDocument`, and `PrintEvent` models. Store template/version, source entity, station, mime type, checksum, object key, size, creator, generation time, retention state, and superseded linkage. Generated documents must be reproducible from persisted transaction snapshots.

## Security and APIs

Use `document.view`, `document.generate`, `document.reprint`, `document.upload`, and module-specific source permissions. Private upload/download uses presigned URLs plus server validation of ownership, type, size, checksum, and expected key prefix.

- Generate/preview/download/reprint endpoints for every required document.
- Presign/finalize upload and permission-checked signed-download endpoints.
- Document directory with filters, source links, version history, and retention metadata.

## Layout requirements

Create 80mm/58mm thermal receipt variants, A4 invoice, thermal/A4 cargo labels with barcode and QR, agent statement, and report templates. Add print-specific CSS, page margins, repeated headers, totals, legal/company identity, receipt footer, and graceful long-field wrapping. Test with browser PDF and target printer dimensions.

## Acceptance checklist

- [ ] Required document types render without clipping or broken pagination.
- [ ] Reprints are identical to the persisted transaction version and audited.
- [ ] Unauthorized or expired signed links cannot retrieve files.
- [ ] File metadata and checksum validation prevent spoofed uploads.
- [ ] Print events and document version changes are searchable.
