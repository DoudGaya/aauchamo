import { requireAccess } from "@/lib/server/access";
import { apiFailure, apiSuccess, parseJson, requestIdFrom } from "@/lib/server/api";
import { z } from "zod";

const runSchema = z.object({
  reportKey: z.string().min(1),
  format: z.enum(["csv", "json"]).default("json"),
  stationId: z.string().optional(),
  businessUnitId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * POST /api/reports/run
 * Triggers a preview-mode (JSON format) run of any report inline.
 * Returns the first 100 rows as JSON data for the preview panel.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    await requireAccess();
    const input = await parseJson(request, runSchema);

    // Build the export URL and call it internally (preview = json, limit to 100 rows)
    const baseUrl = new URL(request.url);
    const exportUrl = new URL("/api/reports/export", baseUrl.origin);
    exportUrl.searchParams.set("report", input.reportKey);
    exportUrl.searchParams.set("format", "json");
    if (input.stationId) exportUrl.searchParams.set("stationId", input.stationId);
    if (input.businessUnitId) exportUrl.searchParams.set("businessUnitId", input.businessUnitId);
    if (input.startDate) exportUrl.searchParams.set("startDate", input.startDate);
    if (input.endDate) exportUrl.searchParams.set("endDate", input.endDate);

    // Forward the auth cookie from the original request
    const cookie = request.headers.get("cookie") ?? "";
    const exportResponse = await fetch(exportUrl.toString(), {
      headers: { cookie },
    });

    if (!exportResponse.ok) {
      const text = await exportResponse.text();
      throw new Error(`Report generation failed: ${exportResponse.status} ${text.slice(0, 200)}`);
    }

    const exportBody = await exportResponse.json() as { ok: boolean; data: Record<string, string>[]; meta: { count: number } };

    // Return preview (first 100 rows) + metadata
    const preview = exportBody.data?.slice(0, 100) ?? [];
    const columns = preview.length > 0 ? Object.keys(preview[0]) : [];

    return apiSuccess(
      {
        reportKey: input.reportKey,
        columns,
        rows: preview,
        totalRows: exportBody.meta?.count ?? preview.length,
        truncated: (exportBody.meta?.count ?? 0) > 100,
        filters: {
          stationId: input.stationId,
          businessUnitId: input.businessUnitId,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      },
      requestId,
      { created: true }
    );
  } catch (error) {
    return apiFailure(error, requestId);
  }
}
