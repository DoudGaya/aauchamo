import { Printer, X, Loader2 } from "lucide-react";
import { useState } from "react";

export function IframePrintModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);

  const printIframe = () => {
    const iframe = document.getElementById("print-iframe-modal") as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "800px", width: "90%", height: "90vh", display: "flex", flexDirection: "column" }}>
        <div className="workflow-header">
          <div>
            <div className="eyebrow">Print Preview</div>
            <h2>{title}</h2>
            <p>Review the document before printing. Close this modal to cancel.</p>
          </div>
          <button className="icon-ghost" onClick={onClose} aria-label="Close modal"><X size={18} /></button>
        </div>
        <div style={{ flex: 1, backgroundColor: "#e5e7eb", overflow: "hidden", position: "relative" }}>
          {loading && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", zIndex: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#6b7280" }}>
                <Loader2 size={32} className="spin" />
                <span>Preparing document...</span>
              </div>
            </div>
          )}
          <iframe 
            id="print-iframe-modal"
            src={url} 
            onLoad={() => setLoading(false)}
            style={{ width: "100%", height: "100%", border: "none" }}
            title={`Print Preview - ${title}`}
          />
        </div>
        <div className="workflow-footer" style={{ padding: "16px 24px" }}>
          <div></div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="button" className="primary-button" onClick={printIframe}>
              <Printer size={16} /> Print Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
