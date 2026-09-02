import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const start = new Date("2026-08-29T00:00:00Z");
    const end = new Date("2026-09-02T23:59:59Z");
    const companyId = "dummy"; // won't match, but shouldn't 404

    const stations = await db.station.findMany({
      where: { companyId, status: "ACTIVE" },
      select: { id: true, code: true, name: true }
    });

    return NextResponse.json({ ok: true, data: stations });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
