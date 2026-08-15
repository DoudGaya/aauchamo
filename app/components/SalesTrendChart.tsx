"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendData = { date: string; sales: number; refunds: number };

export function SalesTrendChart({ data }: { data?: TrendData[] }) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        No sales data available for this period.
      </div>
    );
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `₦${(value / 1000).toFixed(0)}k`;
    return `₦${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "10px", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", color: "var(--text-primary)" }}>
          <p style={{ margin: "0 0 6px 0", fontWeight: 600, fontSize: "12px" }}>{label}</p>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Gross Sales: <span style={{ color: "#3b82f6", fontWeight: 600 }}>₦{Number(payload[0]?.value).toLocaleString()}</span>
          </div>
          {payload[1] && payload[1].value > 0 && (
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Refunds: <span style={{ color: "#ef4444", fontWeight: 600 }}>₦{Number(payload[1]?.value).toLocaleString()}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRefunds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "var(--text-muted)" }} 
            tickFormatter={formatYAxis} 
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="sales" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorSales)" 
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="refunds" 
            stroke="#ef4444" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorRefunds)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
