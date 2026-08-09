import Image from "next/image";
import { notFound } from "next/navigation";
import bwipjs from "bwip-js/node";
import QRCode from "qrcode";

import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import { getRuntimeEnv } from "@/lib/server/env";
import { cargoTrackingToken } from "@/lib/server/tracking";
import styles from "./print.module.css";

export default async function CargoLabelPage({ params, searchParams }: { params: Promise<{ shipmentId: string }>; searchParams: Promise<{ format?: string }> }) {
  const access = requirePermission(await requireAccess(), "cargo.view"); const { shipmentId } = await params; const format = (await searchParams).format === "a4" ? "a4" : "thermal";
  const shipment = await db.cargoShipment.findFirst({ where: { id: shipmentId, companyId: access.companyId }, include: { station: true, company: true } }); if (!shipment) notFound(); requireStation(access, shipment.stationId);
  const token = cargoTrackingToken(shipment.id, shipment.awbNumber); const trackingUrl = `${getRuntimeEnv().APP_URL}/track/${encodeURIComponent(shipment.awbNumber)}?token=${encodeURIComponent(token)}`;
  const barcode = await bwipjs.toBuffer({ bcid: "code128", text: shipment.awbNumber, scale: 3, height: 13, includetext: true, textxalign: "center", backgroundcolor: "FFFFFF" });
  const qr = await QRCode.toDataURL(trackingUrl, { errorCorrectionLevel: "M", margin: 1, width: 180, color: { dark: "#10243d", light: "#ffffff" } });
  const barcodeUrl = `data:image/png;base64,${barcode.toString("base64")}`;
  return <main className={`${styles.sheet} ${styles[format]}`}><header><div><span>AAU CHAMO</span><strong>CARGO / AIR WAYBILL</strong></div><div><small>Origin station</small><b>{shipment.station.code}</b></div></header><section className={styles.route}><div><small>FROM</small><strong>{shipment.origin}</strong></div><i>→</i><div><small>TO</small><strong>{shipment.destination}</strong></div></section><section className={styles.parties}><div><small>SENDER</small><strong>{shipment.senderName}</strong><span>{shipment.senderPhone}</span></div><div><small>RECEIVER</small><strong>{shipment.receiverName}</strong><span>{shipment.receiverPhone}</span><span>{shipment.receiverAddress}</span></div></section><section className={styles.metrics}><div><small>PIECES</small><strong>{shipment.pieces}</strong></div><div><small>WEIGHT</small><strong>{shipment.weightKg.toString()} kg</strong></div><div><small>AIRLINE / FLIGHT</small><strong>{[shipment.airline, shipment.flightNumber].filter(Boolean).join(" · ") || "—"}</strong></div><div><small>FLIGHT DATE</small><strong>{shipment.flightDate ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(shipment.flightDate) : "—"}</strong></div></section><section className={styles.commodity}><small>COMMODITY</small><strong>{shipment.commodity}</strong>{shipment.handlingNotes && <span>{shipment.handlingNotes}</span>}</section><section className={styles.codes}><div><Image src={barcodeUrl} alt={`Barcode ${shipment.awbNumber}`} width={420} height={92} unoptimized /></div><div><Image src={qr} alt="Cargo tracking QR code" width={140} height={140} unoptimized /><small>Scan to track</small></div></section><footer><span>{shipment.company.displayName} · {shipment.awbNumber}</span><span>Status: {shipment.status.replaceAll("_", " ")}</span></footer></main>;
}
