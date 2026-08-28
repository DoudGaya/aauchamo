import Image from "next/image";
import styles from "../[shipmentId]/print.module.css";
import QRCode from "qrcode";
import bwipjs from "bwip-js/node";
import { db } from "@/lib/server/db";

export default async function PreviewLabelPage({ searchParams }: { searchParams: Promise<{ paperSize?: string; marginMm?: string }> }) {
  const { paperSize = "A4", marginMm = "10" } = await searchParams;
  const isThermal = paperSize.startsWith("THERMAL");

  const company = await db.company.findFirst();

  const shipment = {
    awbNumber: "AWB-MOCK-000001",
    origin: "LOS",
    destination: "KAD",
    senderName: "John Doe",
    senderPhone: "08012345678",
    receiverName: "Jane Doe",
    receiverPhone: "08098765432",
    receiverAddress: "123 Mockingbird Lane, Kaduna",
    pieces: 1,
    weightKg: 5,
    airline: "MOCK AIR",
    flightNumber: "MA-123",
    flightDate: new Date(),
    commodity: "Documents",
    isFragile: false,
    handlingNotes: "Deliver before 5PM",
    status: "PENDING",
    company: {
      displayName: company?.displayName || "AAU Chamo",
      address: company?.address || "Address not configured",
      phone: company?.phone || "Phone not configured",
    },
  };

  const barcode = await bwipjs.toBuffer({ bcid: "code128", text: shipment.awbNumber, scale: 3, height: 13, includetext: true, textxalign: "center", backgroundcolor: "FFFFFF" });
  const qr = await QRCode.toDataURL("https://example.com/track/mock", { errorCorrectionLevel: "M", margin: 1, width: 180, color: { dark: "#10243d", light: "#ffffff" } });
  const barcodeUrl = `data:image/png;base64,${barcode.toString("base64")}`;
  const color = "#000000";

  let pageStyle = "";
  if (paperSize === "A4") pageStyle = `@page { size: A4; margin: ${marginMm}mm; } body { font-size: 0.9em; }`;
  else if (paperSize === "A5") pageStyle = `@page { size: A5; margin: ${marginMm}mm; } body { font-size: 0.7em; }`;
  else if (paperSize === "LETTER") pageStyle = `@page { size: letter; margin: 0; } body { font-size: 0.85em; }`;
  else if (paperSize === "THERMAL_100x150") pageStyle = `@page { size: 100mm 150mm; margin: ${marginMm}mm; }`;
  else if (paperSize === "THERMAL_80x100") pageStyle = `@page { size: 80mm 100mm; margin: ${marginMm}mm; }`;
  else pageStyle = `@page { size: auto; margin: ${marginMm}mm; }`;

  const scale = paperSize === "A5" ? 0.65 : paperSize === "LETTER" ? 0.9 : 1;

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      <main className={`${styles.sheet} ${isThermal ? styles.thermal : ""} ${paperSize === "A5" ? styles.a5 : ""} ${paperSize === "LETTER" ? styles.letter : ""}`} style={{ margin: 0, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <div className={styles.tagsContainer}>
          <div className={styles.tagWrap} style={{ borderColor: color }}>
            <div className={styles.tagBottomLine} style={{ backgroundColor: color, height: "12px" }} />
            <div className={styles.tagContent}>
              <div className={styles.tagDestCode} style={{ color }}>{shipment.destination}</div>
              <div className={styles.tagLogoWrap} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Image src={company?.logoDarkObjectKey || company?.logoObjectKey || "/logo.png"} alt="System Logo" width={140 * scale} height={50 * scale} style={{ objectFit: "contain" }} unoptimized />
                <span style={{ marginTop: "4px", textAlign: "center", color: "#555" }}>{shipment.company.address}</span>
                <span style={{ marginTop: "2px", textAlign: "center", color: "#555" }}>{shipment.company.phone}</span>
              </div>
              <div className={styles.tagDestCode} style={{ color }}>{shipment.destination}</div>
            </div>
            <div className={styles.tagBottomLine} style={{ backgroundColor: color, height: "12px" }} />
          </div>
        </div>

        <section className={styles.route} style={{ marginTop: "16px" }}><div><small>FROM</small><strong>{shipment.origin}</strong></div><i>→</i><div><small>TO</small><strong>{shipment.destination}</strong></div></section>
        <section className={styles.parties}><div><small>SENDER</small><strong>{shipment.senderName}</strong><span>{shipment.senderPhone}</span></div><div><small>RECEIVER</small><strong>{shipment.receiverName}</strong><span>{shipment.receiverPhone}</span><span>{shipment.receiverAddress}</span></div></section>
        <section className={styles.metrics}><div><small>PIECES</small><strong>{shipment.pieces}</strong></div><div><small>WEIGHT</small><strong>{shipment.weightKg.toString()} kg</strong></div><div><small>AIRLINE / FLIGHT</small><strong>{[shipment.airline, shipment.flightNumber].filter(Boolean).join(" · ") || "—"}</strong></div><div><small>FLIGHT DATE</small><strong>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(shipment.flightDate)}</strong></div></section>
        <section className={styles.commodity}><small>COMMODITY</small><strong>{shipment.commodity}</strong></section>
        
        <section className={styles.codes}>
          {shipment.isFragile && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Image src="/fragile-cup.svg" alt="FRAGILE" width={120 * scale} height={120 * scale} style={{ objectFit: "contain" }} unoptimized />
              <strong style={{ fontSize: `${16 * scale}px`, marginTop: "6px", letterSpacing: "1px" }}>FRAGILE</strong>
            </div>
          )}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Image src={barcodeUrl} alt={`Barcode ${shipment.awbNumber}`} width={420 * scale} height={92 * scale} unoptimized />
          </div>
          <div>
            <Image src={qr} alt="Cargo tracking QR code" width={140 * scale} height={140 * scale} unoptimized />
            <small>Scan to track</small>
          </div>
        </section>
        
        {shipment.handlingNotes && (
          <div style={{ borderTop: "2px dashed #aeb8c4", padding: "12px 0", marginTop: "4px", marginBottom: "8px", fontSize: "15px", fontWeight: "600", textAlign: "center" }}>
            HANDLING NOTES: {shipment.handlingNotes}
          </div>
        )}

        <footer><span>{shipment.company.displayName} · {shipment.awbNumber}</span><span>Status: {shipment.status}</span></footer>
      </main>
    </div>
  );
}
