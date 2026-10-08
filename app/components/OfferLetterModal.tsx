"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Save,
  RotateCcw,
  Upload,
  FileText,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Eye,
  Edit3,
  Layers,
} from "lucide-react";
import {
  DEFAULT_OFFER_LETTER_TEMPLATE,
  OfferLetterTemplate,
  renderOfferLetterPlaceholders,
} from "@/lib/hr-templates";

interface OfferLetterModalProps {
  target?: any; // Staff member object or undefined
  isTemplateOnly?: boolean;
  company?: any;
  onClose: () => void;
}

export function OfferLetterModal({
  target,
  isTemplateOnly = false,
  company,
  onClose,
}: OfferLetterModalProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "edit" | "freeform">("preview");
  const [template, setTemplate] = useState<OfferLetterTemplate>(DEFAULT_OFFER_LETTER_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing template from server
  useEffect(() => {
    let isMounted = true;
    async function loadTemplate() {
      try {
        const res = await fetch("/api/hr/offer-letter-template");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data?.template) {
            setTemplate(json.data.template);
          }
        }
      } catch (e) {
        console.error("Error loading offer letter template:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTemplate();
    return () => {
      isMounted = false;
    };
  }, []);

  // Format variables for replacement
  const vars = {
    firstName: target?.firstName || (isTemplateOnly ? "Umar" : "Staff"),
    lastName: target?.lastName || (isTemplateOnly ? "Aliyu" : "Member"),
    middleName: target?.middleName || "",
    fullName: target
      ? [target.firstName, target.middleName, target.lastName].filter(Boolean).join(" ")
      : isTemplateOnly
      ? "Umar Aliyu Lalemi"
      : "Staff Member",
    staffNumber: target?.staffNumber || (isTemplateOnly ? "STF-00005" : "AAU-00001"),
    positionName: target?.position?.name || (isTemplateOnly ? "Sales Officer" : "Staff Member"),
    departmentName: target?.department?.name || (isTemplateOnly ? "Operations" : "Operations"),
    stationName: target?.homeStation?.name || (isTemplateOnly ? "Nnamdi Azikiwe International Airport Abuja" : "Head Office"),
    salaryFormatted: target?.salary
      ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(target.salary))
      : isTemplateOnly
      ? "₦150,000.00"
      : "₦[Negotiated]",
    employmentDateFormatted: target?.employmentDate
      ? new Date(target.employmentDate).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
    address: target?.address || "Nigeria",
    phone: target?.phone || "N/A",
    email: target?.email || "N/A",
  };

  const handleClauseChange = (index: number, field: "title" | "text", value: string) => {
    setTemplate((prev) => {
      const newClauses = [...prev.clauses];
      newClauses[index] = { ...newClauses[index], [field]: value };
      return { ...prev, clauses: newClauses };
    });
  };

  const handleAddClause = () => {
    setTemplate((prev) => ({
      ...prev,
      clauses: [
        ...prev.clauses,
        {
          title: `${prev.clauses.length + 1}. Additional Clause`,
          text: "Specify terms and operational guidelines for this clause.",
        },
      ],
    }));
  };

  const handleRemoveClause = (index: number) => {
    setTemplate((prev) => ({
      ...prev,
      clauses: prev.clauses.filter((_, i) => i !== index),
    }));
  };

  const insertPlaceholder = (tag: string) => {
    navigator.clipboard.writeText(`{${tag}}`);
    setStatusMessage({ type: "success", text: `Copied {${tag}} to clipboard! Paste it into any clause or paragraph.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Check if it's full free-form text or contains clauses
      setTemplate((prev) => ({
        ...prev,
        fullBodyOverride: text,
      }));
      setActiveTab("preview");
      setStatusMessage({ type: "success", text: `Successfully loaded template from ${file.name}!` });
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleSaveAsDefault = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/hr/offer-letter-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || "Failed to save template.");
      setStatusMessage({ type: "success", text: "Offer letter template saved as company default!" });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save template." });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("Reset offer letter template to the standard AAU Chamo legal template?")) {
      setTemplate(DEFAULT_OFFER_LETTER_TEMPLATE);
      setStatusMessage({ type: "success", text: "Reset to default AAU Chamo offer letter template." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const printDocument = () => {
    const printWindow = window.open("", "_blank", "width=850,height=1000");
    if (!printWindow) return;

    const logoUrl = new URL("/logo.png", window.location.origin).toString();
    const renderedSubject = renderOfferLetterPlaceholders(template.subject, vars);
    const renderedSalutation = renderOfferLetterPlaceholders(template.salutation, vars);
    const renderedOpening = renderOfferLetterPlaceholders(template.openingText, vars);
    const renderedClosing = renderOfferLetterPlaceholders(template.closingText, vars);
    const renderedSignatoryLeft = renderOfferLetterPlaceholders(template.signatoryLeft || "Head of Human Resources\nAAU Chamo Groups", vars);
    const renderedSignatoryRight = renderOfferLetterPlaceholders(template.signatoryRight || "Employee Signature & Date\nI accept the terms of this appointment", vars);

    const bodyContentHtml = template.fullBodyOverride
      ? `<div class="content">${renderOfferLetterPlaceholders(template.fullBodyOverride, vars)
          .split("\n\n")
          .map((p) => `<p>${p.replaceAll("\n", "<br />")}</p>`)
          .join("")}</div>`
      : `<div class="content">
          <p>${renderedSalutation}</p>
          ${renderedOpening.split("\n\n").map((p) => `<p>${p}</p>`).join("")}
          ${template.clauses
            .map(
              (c) => `
            <div class="clause-title">${renderOfferLetterPlaceholders(c.title, vars)}</div>
            <p>${renderOfferLetterPlaceholders(c.text, vars)}</p>
          `
            )
            .join("")}
          ${renderedClosing.split("\n\n").map((p) => `<p>${p}</p>`).join("")}
        </div>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Offer Letter - ${vars.staffNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              padding: 20px 40px;
              color: #111827;
              line-height: 1.6;
              font-size: 14.5px;
            }
            .letterhead {
              text-align: center;
              border-bottom: 3px double #b91c1c;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .letterhead img {
              max-height: 70px;
              object-fit: contain;
              margin-bottom: 8px;
            }
            .letterhead h1 {
              font-size: 20px;
              margin: 0 0 4px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #b91c1c;
            }
            .letterhead p {
              margin: 2px 0;
              font-size: 11px;
              color: #4b5563;
              font-family: 'Segoe UI', Arial, sans-serif;
            }
            .date {
              margin-bottom: 15px;
              font-weight: bold;
            }
            .recipient {
              margin-bottom: 20px;
              line-height: 1.4;
            }
            .subject {
              text-align: center;
              font-weight: bold;
              text-transform: uppercase;
              margin: 20px 0;
              text-decoration: underline;
              font-size: 15px;
            }
            .content p {
              margin-bottom: 12px;
              text-align: justify;
            }
            .clause-title {
              font-weight: bold;
              margin-top: 14px;
              margin-bottom: 4px;
              text-transform: uppercase;
              font-size: 13.5px;
              color: #111827;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .signature-box {
              width: 250px;
            }
            .signature-line {
              border-top: 1px solid #111827;
              margin-top: 45px;
              padding-top: 5px;
              text-align: center;
              font-size: 13px;
              white-space: pre-line;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <img src="${logoUrl}" alt="AAU Chamo Logo" /><br />
            <h1>A.A.U Chamo International Business Agency Services Limited</h1>
            <p>Corporate Headquarters: ${company?.address || "No 68 Chamo Plaza Hotoro Eastern By-pass Beside Matrix Filling Station Kano"} | Tel: ${company?.phone || "09168340588"} | Email: ${company?.email || "aauchamo@gmail.com"}</p>
            <p>www.aauchamo.com</p>
          </div>
          
          <div class="date">Date: ${vars.employmentDateFormatted}</div>
          
          <div class="recipient">
            <strong>To:</strong><br />
            ${vars.fullName}<br />
            Staff Reference Number: ${vars.staffNumber}<br />
            Residential Address: ${vars.address}
          </div>
          
          <div class="subject">${renderedSubject}</div>
          
          ${bodyContentHtml}
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">${renderedSignatoryLeft}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">${renderedSignatoryRight}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "850px", width: "95vw", height: "92vh", display: "flex", flexDirection: "column" }}>
        
        {/* MODAL HEADER */}
        <div className="workflow-header" style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--primary)" }}>
              HR Documentation & Appointments
            </span>
            <h2 style={{ margin: "2px 0 0", fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <FileText size={20} className="text-primary" />
              {isTemplateOnly ? "Company Offer Letter Template" : `Offer Letter: ${vars.fullName} (${vars.staffNumber})`}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="icon-ghost">
            <X size={20} />
          </button>
        </div>

        {/* TABS & TOOLBAR */}
        <div style={{ padding: "8px 24px", borderBottom: "1px solid var(--border-color)", background: "var(--card-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={activeTab === "preview" ? "primary-button" : "secondary-button"}
              style={{ height: "34px", padding: "0 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Eye size={15} />
              <span>Preview Letter</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={activeTab === "edit" ? "primary-button" : "secondary-button"}
              style={{ height: "34px", padding: "0 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Edit3 size={15} />
              <span>Modify Clauses & Text</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("freeform")}
              className={activeTab === "freeform" ? "primary-button" : "secondary-button"}
              style={{ height: "34px", padding: "0 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Layers size={15} />
              <span>Free-form / Custom Style</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt,.html,.htm,.md"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => fileInputRef.current?.click()}
              style={{ height: "34px", padding: "0 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}
              title="Upload custom letter template file (.txt, .html, .md)"
            >
              <Upload size={14} />
              <span>Upload Template</span>
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleResetToDefault}
              style={{ height: "34px", padding: "0 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}
              title="Reset back to standard AAU Chamo format"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* STATUS NOTIFICATION */}
        {statusMessage && (
          <div
            style={{
              padding: "8px 24px",
              background: statusMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: statusMessage.type === "success" ? "#065f46" : "#991b1b",
              borderBottom: "1px solid var(--border-color)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {statusMessage.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "var(--bg-main)" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading template...</div>
          ) : activeTab === "preview" ? (
            /* PREVIEW TAB */
            <div
              style={{
                maxWidth: "720px",
                margin: "0 auto",
                background: "#ffffff",
                color: "#111827",
                padding: "45px 55px",
                borderRadius: "4px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: "14.5px",
                lineHeight: "1.6",
              }}
            >
              {/* Header Letterhead */}
              <div style={{ textAlign: "center", borderBottom: "3px double #b91c1c", paddingBottom: "15px", marginBottom: "25px" }}>
                <img src="/logo.png" alt="AAU Chamo Logo" style={{ maxHeight: "70px", objectFit: "contain", marginBottom: "6px" }} /><br />
                <h1 style={{ fontSize: "20px", margin: "0 0 4px", letterSpacing: "0.5px", textTransform: "uppercase", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#b91c1c" }}>
                  A.A.U Chamo International Business Agency Services Limited
                </h1>
                <p style={{ margin: "2px 0", fontSize: "11px", color: "#4b5563", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                  Corporate Headquarters: {company?.address || "No 68 Chamo Plaza Hotoro Eastern By-pass Beside Matrix Filling Station Kano"} | Tel: {company?.phone || "09168340588"} | Email: {company?.email || "aauchamo@gmail.com"}
                </p>
                <p style={{ margin: "2px 0", fontSize: "11px", color: "#4b5563", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                  www.aauchamo.com
                </p>
              </div>

              {/* Date & Recipient */}
              <div style={{ marginBottom: "15px", fontWeight: "bold" }}>
                Date: {vars.employmentDateFormatted}
              </div>

              <div style={{ marginBottom: "20px", lineHeight: "1.4" }}>
                <strong>To:</strong><br />
                {vars.fullName}<br />
                Staff Reference Number: {vars.staffNumber}<br />
                Residential Address: {vars.address}
              </div>

              {/* Subject */}
              <div style={{ textAlign: "center", fontWeight: "bold", textTransform: "uppercase", margin: "20px 0", textDecoration: "underline", fontSize: "15px" }}>
                {renderOfferLetterPlaceholders(template.subject, vars)}
              </div>

              {/* Body Content */}
              {template.fullBodyOverride ? (
                <div>
                  {renderOfferLetterPlaceholders(template.fullBodyOverride, vars)
                    .split("\n\n")
                    .map((p, idx) => (
                      <p key={idx} style={{ marginBottom: "12px", textAlign: "justify", whiteSpace: "pre-line" }}>
                        {p}
                      </p>
                    ))}
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: "12px" }}>
                    {renderOfferLetterPlaceholders(template.salutation, vars)}
                  </p>
                  {renderOfferLetterPlaceholders(template.openingText, vars)
                    .split("\n\n")
                    .map((p, idx) => (
                      <p key={idx} style={{ marginBottom: "12px", textAlign: "justify" }}>
                        {p}
                      </p>
                    ))}

                  {template.clauses.map((clause, idx) => (
                    <div key={idx} style={{ marginBottom: "12px" }}>
                      <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "13.5px", marginTop: "14px", marginBottom: "4px" }}>
                        {renderOfferLetterPlaceholders(clause.title, vars)}
                      </div>
                      <p style={{ textAlign: "justify", margin: 0 }}>
                        {renderOfferLetterPlaceholders(clause.text, vars)}
                      </p>
                    </div>
                  ))}

                  {renderOfferLetterPlaceholders(template.closingText, vars)
                    .split("\n\n")
                    .map((p, idx) => (
                      <p key={idx} style={{ marginBottom: "12px", textAlign: "justify" }}>
                        {p}
                      </p>
                    ))}
                </div>
              )}

              {/* Signatures */}
              <div style={{ marginTop: "45px", display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: "230px" }}>
                  <div style={{ borderTop: "1px solid #111827", marginTop: "45px", paddingTop: "5px", textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" }}>
                    {renderOfferLetterPlaceholders(template.signatoryLeft || "Head of Human Resources\nAAU Chamo Groups", vars)}
                  </div>
                </div>
                <div style={{ width: "230px" }}>
                  <div style={{ borderTop: "1px solid #111827", marginTop: "45px", paddingTop: "5px", textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" }}>
                    {renderOfferLetterPlaceholders(template.signatoryRight || "Employee Signature & Date\nI accept the terms of this appointment", vars)}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "edit" ? (
            /* STRUCTURED CLAUSES EDIT TAB */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "800px", margin: "0 auto" }}>
              {/* Placeholders bar */}
              <div style={{ background: "var(--card-bg)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Click to copy dynamic variable tags:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {["firstName", "lastName", "fullName", "staffNumber", "position", "department", "station", "salary", "employmentDate", "address"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertPlaceholder(tag)}
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "2px 8px", height: "26px", borderRadius: "4px" }}
                    >
                      {`{${tag}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject & Salutation */}
              <div className="form-grid">
                <div>
                  <label className="field-label" style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                    Letter Subject Line
                  </label>
                  <input
                    className="field-input"
                    value={template.subject}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="field-label" style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                    Salutation
                  </label>
                  <input
                    className="field-input"
                    value={template.salutation}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, salutation: e.target.value }))}
                  />
                </div>
              </div>

              {/* Opening Paragraph */}
              <div>
                <label className="field-label" style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                  Opening Paragraph
                </label>
                <textarea
                  className="field-input"
                  rows={3}
                  value={template.openingText}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, openingText: e.target.value }))}
                />
              </div>

              {/* Clauses Section */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>Terms & Summary Clauses ({template.clauses.length})</h3>
                <button
                  type="button"
                  onClick={handleAddClause}
                  className="secondary-button"
                  style={{ height: "30px", fontSize: "12px", padding: "0 10px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Plus size={14} /> Add Clause
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {template.clauses.map((clause, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--card-bg)",
                      padding: "12px 16px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input
                        className="field-input"
                        style={{ fontWeight: "600", flex: 1 }}
                        value={clause.title}
                        onChange={(e) => handleClauseChange(idx, "title", e.target.value)}
                        placeholder="Clause Title (e.g. 1. Commencement and Duties)"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveClause(idx)}
                        className="icon-ghost"
                        style={{ color: "#ef4444" }}
                        title="Delete clause"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <textarea
                      className="field-input"
                      rows={3}
                      value={clause.text}
                      onChange={(e) => handleClauseChange(idx, "text", e.target.value)}
                      placeholder="Clause terms, duration, description..."
                    />
                  </div>
                ))}
              </div>

              {/* Closing Paragraph */}
              <div style={{ marginTop: "10px" }}>
                <label className="field-label" style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                  Closing & Acceptance Instructions
                </label>
                <textarea
                  className="field-input"
                  rows={3}
                  value={template.closingText}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, closingText: e.target.value }))}
                />
              </div>

              {/* Signatories */}
              <div className="form-grid" style={{ marginTop: "10px" }}>
                <div>
                  <label className="field-label" style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                    Left Signatory (Employer)
                  </label>
                  <textarea
                    className="field-input"
                    rows={2}
                    value={template.signatoryLeft || ""}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, signatoryLeft: e.target.value }))}
                    placeholder="Head of Human Resources&#10;AAU Chamo Groups"
                  />
                </div>
                <div>
                  <label className="field-label" style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                    Right Signatory (Employee)
                  </label>
                  <textarea
                    className="field-input"
                    rows={2}
                    value={template.signatoryRight || ""}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, signatoryRight: e.target.value }))}
                    placeholder="Employee Signature & Date&#10;I accept the terms of this appointment"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* FREE-FORM FULL DOCUMENT OVERRIDE TAB */
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "800px", margin: "0 auto" }}>
              <div style={{ background: "var(--card-bg)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Use this free-form editor to paste or write a completely custom letter format. Dynamic tags like <code>{"{name}"}</code>, <code>{"{position}"}</code>, <code>{"{salary}"}</code>, <code>{"{station}"}</code> will automatically be replaced with employee records.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {["firstName", "lastName", "fullName", "staffNumber", "position", "department", "station", "salary", "employmentDate", "address"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertPlaceholder(tag)}
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "2px 8px", height: "26px", borderRadius: "4px" }}
                    >
                      {`{${tag}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label" style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                  Complete Custom Letter Body
                </label>
                <textarea
                  className="field-input"
                  style={{ minHeight: "350px", fontFamily: "monospace", fontSize: "13px", lineHeight: "1.5" }}
                  value={template.fullBodyOverride || ""}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, fullBodyOverride: e.target.value }))}
                  placeholder="Paste your full custom offer letter text or uploaded document content here...&#10;&#10;Dear {firstName},&#10;&#10;We are delighted to offer you the position of {position} in {department}..."
                />
              </div>

              {template.fullBodyOverride && (
                <button
                  type="button"
                  className="secondary-button"
                  style={{ alignSelf: "flex-start", fontSize: "12px" }}
                  onClick={() => setTemplate((prev) => ({ ...prev, fullBodyOverride: null }))}
                >
                  Clear Custom Override (Revert to Standard Clauses)
                </button>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-color)",
            background: "var(--card-bg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="primary-button"
              onClick={printDocument}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 18px", height: "38px" }}
            >
              <Printer size={16} />
              <span>{isTemplateOnly ? "Print Sample Letter" : "Print Offer Letter / PDF"}</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={handleSaveAsDefault}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 16px", height: "38px" }}
            >
              <Save size={15} />
              <span>{saving ? "Saving..." : "Save as Company Default Template"}</span>
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              style={{ padding: "0 16px", height: "38px" }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
