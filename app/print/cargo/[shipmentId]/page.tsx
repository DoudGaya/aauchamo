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
  const access = requirePermission(await requireAccess(), "cargo.view");
  const { shipmentId } = await params;
  const { format: urlFormat } = await searchParams;
  const shipment = await db.cargoShipment.findFirst({ where: { id: shipmentId, companyId: access.companyId }, include: { station: true, company: true } }); if (!shipment) notFound(); requireStation(access, shipment.stationId);
  const token = cargoTrackingToken(shipment.id, shipment.awbNumber); const trackingUrl = `${getRuntimeEnv().APP_URL}/track/${encodeURIComponent(shipment.awbNumber)}?token=${encodeURIComponent(token)}`;
  const barcode = await bwipjs.toBuffer({ bcid: "code128", text: shipment.awbNumber, scale: 3, height: 13, includetext: true, textxalign: "center", backgroundcolor: "FFFFFF" });
  const qr = await QRCode.toDataURL(trackingUrl, { errorCorrectionLevel: "M", margin: 1, width: 180, color: { dark: "#10243d", light: "#ffffff" } });
  const barcodeUrl = `data:image/png;base64,${barcode.toString("base64")}`;
  const settings = await db.systemSetting.findMany({ where: { companyId: access.companyId, namespace: "printer" } });
  let paperSize = (settings.find(s => s.key === "paperSize")?.value as string) || "A4";
  if (urlFormat === "thermal") {
    paperSize = "THERMAL_100x150";
  } else if (urlFormat === "a4") {
    paperSize = "A4";
  }
  const isThermal = paperSize.startsWith("THERMAL");

  const destinationColors: Record<string, string> = {
    ABV: "#dc2626", MIU: "#1e3a8a", KAN: "#14532d", SKO: "#7f1d1d",
    ILR: "#4b5563", YOL: "#000000", NBK: "#2563eb", LOS: "#eab308",
    GMO: "#fa8072", KAD: "#06b6d4",
  };
  const color = destinationColors[shipment.destination] || "#000000";

  const marginMm = isThermal ? 2 : 10;
  let pageStyle = "";
  if (paperSize === "A4") pageStyle = `@page { size: A4; margin: ${marginMm}mm; }`;
  else if (paperSize === "A5") pageStyle = `@page { size: A5; margin: ${marginMm}mm; }`;
  else if (paperSize === "THERMAL_100x150") pageStyle = `@page { size: 100mm 150mm; margin: ${marginMm}mm; }`;
  else if (paperSize === "THERMAL_80x100") pageStyle = `@page { size: 80mm 100mm; margin: ${marginMm}mm; }`;
  else pageStyle = `@page { size: auto; margin: ${marginMm}mm; }`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      <main className={`${styles.sheet} ${isThermal ? styles.thermal : ""}`}>
        <header><div><span>AAU CHAMO</span><strong>CARGO / AIR WAYBILL</strong></div><div><small>Origin station</small><b>{shipment.station.code}</b></div></header>
        <section className={styles.route}><div><small>FROM</small><strong>{shipment.origin}</strong></div><i>→</i><div><small>TO</small><strong>{shipment.destination}</strong></div></section>
        <section className={styles.parties}><div><small>SENDER</small><strong>{shipment.senderName}</strong><span>{shipment.senderPhone}</span></div><div><small>RECEIVER</small><strong>{shipment.receiverName}</strong><span>{shipment.receiverPhone}</span><span>{shipment.receiverAddress}</span></div></section>
        <section className={styles.metrics}><div><small>PIECES</small><strong>{shipment.pieces}</strong></div><div><small>WEIGHT</small><strong>{shipment.weightKg.toString()} kg</strong></div><div><small>AIRLINE / FLIGHT</small><strong>{[shipment.airline, shipment.flightNumber].filter(Boolean).join(" · ") || "—"}</strong></div><div><small>FLIGHT DATE</small><strong>{shipment.flightDate ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(shipment.flightDate) : "—"}</strong></div></section>
        <section className={styles.commodity}><small>COMMODITY</small><strong>{shipment.commodity}</strong>{shipment.handlingNotes && <span>{shipment.handlingNotes}</span>}</section>
        <section className={styles.codes}><div><Image src={barcodeUrl} alt={`Barcode ${shipment.awbNumber}`} width={420} height={92} unoptimized /></div><div><Image src={qr} alt="Cargo tracking QR code" width={140} height={140} unoptimized /><small>Scan to track</small></div></section>
        <footer><span>{shipment.company.displayName} · {shipment.awbNumber}</span><span>Status: {shipment.status.replaceAll("_", " ")}</span></footer>
        
        <div className={styles.tagsContainer}>
          <div className={styles.tagWrap} style={{ borderColor: color }}>
            <div className={styles.tagContent}>
              <div className={styles.tagDestCode} style={{ color }}>{shipment.destination}</div>
              <div className={styles.tagLogoWrap}>
                <Image src="/logo.png" alt="AAU Chamo" width={140} height={50} style={{ objectFit: "contain" }} unoptimized />
              </div>
              <div className={styles.tagDestCode} style={{ color }}>{shipment.destination}</div>
            </div>
            <div className={styles.tagBottomLine} style={{ backgroundColor: color }} />
          </div>
        </div>
      </main>
    </>
  );
}
