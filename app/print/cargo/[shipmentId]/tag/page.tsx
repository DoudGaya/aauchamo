import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAccess, requirePermission, requireStation } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import styles from "./print.module.css";

const destinationColors: Record<string, string> = {
  ABV: "#dc2626", // Red
  MIU: "#1e3a8a", // Dark Blue
  KAN: "#14532d", // Dark Green
  SKO: "#7f1d1d", // Maroon
  ILR: "#4b5563", // Gray
  YOL: "#000000", // Black
  NBK: "#2563eb", // Blue
  LOS: "#eab308", // Yellow
  GMO: "#fa8072", // Salmon
  KAD: "#06b6d4", // Vivid Cyan
};

export default async function CargoTagPage({ params }: { params: Promise<{ shipmentId: string }> }) {
  const access = requirePermission(await requireAccess(), "cargo.view");
  const { shipmentId } = await params;
  const shipment = await db.cargoShipment.findFirst({ where: { id: shipmentId, companyId: access.companyId }, include: { company: true } });
  
  if (!shipment) notFound();
  requireStation(access, shipment.stationId);

  // Default to black if the route code isn't strictly defined
  const color = destinationColors[shipment.destination] || "#000000";
  const pieces = shipment.pieces > 0 ? shipment.pieces : 1;
  const tags = Array.from({ length: pieces });

  return (
    <>
      {tags.map((_, i) => (
        <div key={i} className={styles.sheet}>
          <div className={styles.tagWrap} style={{ borderColor: color }}>
            <div className={styles.topLine} style={{ backgroundColor: color }} />
            <div className={styles.tagContent}>
              <div className={styles.destCode} style={{ color }}>
                {shipment.destination}
              </div>
              
              <div className={styles.logoWrap}>
                <Image src={shipment.company.logoDarkObjectKey || shipment.company.logoObjectKey || "/logo.png"} alt="AAU Chamo" width={140} height={50} style={{ objectFit: "contain" }} unoptimized />
              </div>
            
              <div className={styles.destCode} style={{ color }}>
                {shipment.destination}
              </div>
            </div>
          
            <div className={styles.bottomLine} style={{ backgroundColor: color }} />
          </div>
        </div>
      ))}
    </>
  );
}
