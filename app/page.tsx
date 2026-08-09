import ERPWorkspace from "./erp-workspace";
import { redirect } from "next/navigation";

import { requireAccess } from "@/lib/server/access";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let access;
  try {
    access = await requireAccess();
  } catch {
    redirect("/login");
  }

  const allowedStations = await db.station.findMany({
    where: {
      companyId: access.companyId,
      status: "ACTIVE",
      ...(access.companyWide ? {} : { id: { in: [...access.stationIds] } }),
    },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <ERPWorkspace
      identity={{
        name: access.name,
        email: access.email ?? access.username,
        role: access.roleNames.join(" · ") || "Authorized user",
        permissions: [...access.permissions],
        companyWide: access.companyWide,
      }}
      allowedStations={allowedStations}
    />
  );
}
