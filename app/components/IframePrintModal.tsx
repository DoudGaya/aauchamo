import { Printer, X } from "lucide-react";

export function IframePrintModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
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
          <iframe 
            id="print-iframe-modal"
            src={url} 
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
