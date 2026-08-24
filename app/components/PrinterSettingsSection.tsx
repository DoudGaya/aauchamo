import { useState } from "react";
import { Check } from "lucide-react";
import { Field } from "@/app/erp-workspace"; // assuming Field is exported, or I can just use div. Wait, Field is not exported.

export function PrinterSettingsSection({ api, onToast }: { api: any, onToast: (toast: any) => void }) {
  const settings = api.data?.settings.filter((s: any) => s.namespace === "printer") || [];
  
  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value || "";
  
  const [paperSize, setPaperSize] = useState(getSetting("paperSize") || "A4");
  const [marginMm, setMarginMm] = useState(getSetting("marginMm") || "10");
  const [copies, setCopies] = useState(getSetting("copies") || "1");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updates = [
        { type: "SETTING", namespace: "printer", key: "paperSize", valueType: "STRING", value: paperSize },
        { type: "SETTING", namespace: "printer", key: "marginMm", valueType: "STRING", value: marginMm },
        { type: "SETTING", namespace: "printer", key: "copies", valueType: "STRING", value: copies },
      ];
      
      await Promise.all(updates.map(async (payload) => {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to save printer setting");
      }));
      
      api.reload();
      onToast({ title: "Printer settings saved", detail: "Configuration was updated across the workspace." });
    } catch (err: any) {
      onToast({ title: "Save failed", detail: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem" }}>
      <form onSubmit={save} className="form-grid" style={{ flex: 1, minWidth: "300px", height: "fit-content" }}>
        <div className="field-group" style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Paper size</label>
          <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} required style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--line)" }}>
            <option value="A4">A4 (Standard)</option>
            <option value="A5">A5 (Half size)</option>
            <option value="LETTER">Letter (US)</option>
            <option value="THERMAL_100x150">Thermal (100x150mm)</option>
            <option value="THERMAL_80x100">Thermal (80x100mm)</option>
          </select>
        </div>
        
        <div className="field-group" style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Margin (mm)</label>
          <input type="number" min="0" max="50" value={marginMm} onChange={(e) => setMarginMm(e.target.value)} required style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--line)" }} />
        </div>
        
        <div className="field-group" style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Copies per print</label>
          <input type="number" min="1" max="10" value={copies} onChange={(e) => setCopies(e.target.value)} required style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--line)" }} />
        </div>
        
        <div style={{ marginTop: "1rem" }}>
          <button disabled={busy} className="primary-button" style={{ height: "35px" }}><Check size={16} />{busy ? "Saving…" : "Save configuration"}</button>
        </div>
      </form>
      
      <div style={{ flex: 1.5, minWidth: "400px", border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden", height: "600px", background: "#f9fafb", display: "flex", flexDirection: "column", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ padding: "12px", borderBottom: "1px solid var(--line)", background: "#fff", fontWeight: 600, fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Live Print Preview</span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 400 }}>Updates dynamically</span>
        </div>
        <iframe 
          src={`/print/cargo/preview?paperSize=${paperSize}&marginMm=${marginMm}`}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Print Preview"
        />
      </div>
    </div>
  );
}
