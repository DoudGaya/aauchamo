import { db } from "@/lib/server/db";
import { apiFailure, apiSuccess, requestIdFrom } from "@/lib/server/api";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const company = await db.company.findFirst();
    if (!company) {
      throw new Error("No company found.");
    }
    
    const destinationColors: Record<string, string> = {
      ABV: "#dc2626", MIU: "#1e3a8a", KAN: "#14532d", SKO: "#7f1d1d",
      ILR: "#4b5563", YOL: "#000000", NBK: "#2563eb", LOS: "#eab308",
      GMO: "#fa8072", KAD: "#06b6d4",
    };

    const names: Record<string, string> = {
      ABV: "Abuja", MIU: "Maiduguri", KAN: "Kano", SKO: "Sokoto",
      ILR: "Ilorin", YOL: "Yola", NBK: "Unknown", LOS: "Lagos",
      GMO: "Unknown", KAD: "Kaduna",
    };

    let count = 0;
    for (const [code, color] of Object.entries(destinationColors)) {
      const existing = await db.cargoLocation.findFirst({
        where: { companyId: company.id, code }
      });
      if (!existing) {
        await db.cargoLocation.create({
          data: {
            companyId: company.id,
            code,
            name: names[code] || code,
            color,
            isActive: true
          }
        });
        count++;
      }
    }

    return apiSuccess({ count }, requestId);
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
