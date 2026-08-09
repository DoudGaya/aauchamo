import { CheckCircle2, MapPin, PackageOpen, Plane } from "lucide-react";
import { notFound } from "next/navigation";

import { db } from "@/lib/server/db";
import { isValidCargoTrackingToken } from "@/lib/server/tracking";
import styles from "./track.module.css";

export default async function CargoTrackingPage({ params, searchParams }: { params: Promise<{ awb: string }>; searchParams: Promise<{ token?: string }> }) {
  const { awb } = await params; const { token } = await searchParams; const shipment = await db.cargoShipment.findFirst({ where: { awbNumber: awb }, select: { id: true, awbNumber: true, origin: true, destination: true, status: true, pieces: true, weightKg: true, createdAt: true, events: { select: { id: true, status: true, location: true, notes: true, occurredAt: true }, orderBy: { occurredAt: "asc" } } } });
  if (!shipment || !token || !isValidCargoTrackingToken(shipment.id, shipment.awbNumber, token)) notFound();
  return <main className={styles.page}><section className={styles.card}><header><span><Plane size={20} /> AAU CHAMO</span><small>Secure cargo tracking</small></header><div className={styles.hero}><span><PackageOpen size={28} /></span><div><small>AIR WAYBILL</small><h1>{shipment.awbNumber}</h1><p>{shipment.origin} <b>→</b> {shipment.destination}</p></div><em>{shipment.status.replaceAll("_", " ")}</em></div><div className={styles.metrics}><div><small>PIECES</small><strong>{shipment.pieces}</strong></div><div><small>WEIGHT</small><strong>{shipment.weightKg.toString()} kg</strong></div><div><small>CREATED</small><strong>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(shipment.createdAt)}</strong></div></div><div className={styles.timeline}>{shipment.events.map((event, index) => <article key={event.id}><span>{index === shipment.events.length - 1 ? <CheckCircle2 size={17} /> : <MapPin size={16} />}</span><div><strong>{event.status.replaceAll("_", " ")}</strong><small>{event.location || event.notes || "Status recorded"}</small></div><time>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(event.occurredAt)}</time></article>)}</div><footer>Tracking links contain no sender, receiver, payment, or identity data.</footer></section></main>;
}
