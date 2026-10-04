"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type CargoTrendPoint = {
  date: string;
  shipments: number;
  weightKg: number;
  pieces?: number;
};

export function CargoTrendChart({ data }: { data?: CargoTrendPoint[] }) {
  const [metric, setMetric] = useState<"both" | "weight" | "shipments">("both");

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        No cargo trend data available for this period.
      </div>
    );
  }

  const formatWeightY = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}t`;
    return `${value}kg`;
  };

  const formatCountY = (value: number) => `${value}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0]?.payload as CargoTrendPoint | undefined;
      return (
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "10px 12px", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", color: "var(--text-primary)" }}>
          <p style={{ margin: "0 0 6px 0", fontWeight: 600, fontSize: "12px", borderBottom: "1px solid var(--line-subtle)", paddingBottom: "4px" }}>{label}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Total Weight:</span>
              <strong style={{ color: "#0ea5e9" }}>{Number(pData?.weightKg ?? 0).toLocaleString()} kg</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Shipments (AWB):</span>
              <strong style={{ color: "#8b5cf6" }}>{Number(pData?.shipments ?? 0).toLocaleString()}</strong>
            </div>
            {pData?.pieces !== undefined && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Pieces:</span>
                <strong style={{ color: "var(--text-primary)" }}>{Number(pData.pieces).toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Metric Selector pill bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginBottom: "8px" }}>
        <button
          type="button"
          onClick={() => setMetric("both")}
          className={`filter-chip${metric === "both" ? " active" : ""}`}
          style={{ fontSize: "11px", padding: "3px 8px", height: "auto" }}
        >
          Combined
        </button>
        <button
          type="button"
          onClick={() => setMetric("weight")}
          className={`filter-chip${metric === "weight" ? " active" : ""}`}
          style={{ fontSize: "11px", padding: "3px 8px", height: "auto" }}
        >
          Tonnage (kg)
        </button>
        <button
          type="button"
          onClick={() => setMetric("shipments")}
          className={`filter-chip${metric === "shipments" ? " active" : ""}`}
          style={{ fontSize: "11px", padding: "3px 8px", height: "auto" }}
        >
          Shipments (AWB)
        </button>
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCargoWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="colorCargoShipments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line-subtle)" />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              dy={10}
              minTickGap={20}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickFormatter={metric === "shipments" ? formatCountY : formatWeightY}
              width={55}
            />
            {metric === "both" && (
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickFormatter={formatCountY}
                width={40}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            {(metric === "both" || metric === "weight") && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="weightKg"
                name="Weight (kg)"
                stroke="#0ea5e9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCargoWeight)"
                isAnimationActive={false}
              />
            )}
            {(metric === "both" || metric === "shipments") && (
              <Area
                yAxisId={metric === "both" ? "right" : "left"}
                type="monotone"
                dataKey="shipments"
                name="Shipments"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCargoShipments)"
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
