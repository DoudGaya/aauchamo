"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  LogIn,
  User,
  Building2,
  Map,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

export default function MobileAttendancePage() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  
  // GPS State
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"acquiring" | "success" | "error">("acquiring");
  const [gpsErrorMessage, setGpsErrorMessage] = useState("");

  // PWA Install prompt state
  const [showPwaTip, setShowPwaTip] = useState(false);

  // 1. Live Clock Timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      setCurrentDate(now.toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch Today's Attendance Status
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/attendance/today");
      const json = await res.json();
      if (res.ok && json.ok) {
        setData(json.data);
      } else {
        setData({ hasStaffRecord: false, message: json.error?.message ?? "Unable to load attendance status." });
      }
    } catch (e) {
      setData({ hasStaffRecord: false, message: "Network connection error." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 3. Acquire GPS Location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsErrorMessage("Geolocation is not supported by your browser.");
      return;
    }
    setGpsStatus("acquiring");
    setGpsErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGpsStatus("success");
      },
      (err) => {
        setCoords(null);
        setGpsStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setGpsErrorMessage("GPS access denied. Please allow location permissions in your mobile browser settings.");
        } else {
          setGpsErrorMessage("Unable to acquire high-accuracy GPS fix. Please step outside or retry.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // 4. Handle Clock In / Clock Out
  const handleClock = async (action: "in" | "out") => {
    if (!coords) {
      alert("GPS location fix required to punch clock. Please enable location services.");
      requestLocation();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/staff/attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          latitude: coords.latitude,
          longitude: coords.longitude,
          notes: notes || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message ?? `Clock ${action} failed.`);
      }

      setNotes("");
      await fetchStatus();
    } catch (err: any) {
      alert(err.message || "Failed to record attendance.");
    } finally {
      setBusy(false);
    }
  };

  const statusInfo = data?.todayStatus;
  const staffInfo = data?.staff;
  const isClockedIn = statusInfo?.isClockedIn;
  const isClockedOut = statusInfo?.isClockedOut;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#071325",
      color: "#f8fafc",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "16px 16px 32px",
      maxWidth: "500px",
      margin: "0 auto",
      position: "relative",
    }}>
      {/* Background Decorative Gradient Blobs */}
      <div style={{
        position: "absolute",
        top: "-100px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(11, 31, 58, 0) 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Top Header */}
      <header style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0 16px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "18px",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}>
            A
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px", letterSpacing: "0.5px", color: "#ffffff" }}>
              AAU CHAMO
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>
              Attendance Punch Clock
            </div>
          </div>
        </div>

        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#cbd5e1",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            textDecoration: "none",
            fontWeight: "600",
            transition: "all 0.2s ease",
          }}
        >
          <ChevronLeft size={14} />
          <span>Full ERP</span>
        </Link>
      </header>

      {/* Main Container */}
      <main style={{ width: "100%", zIndex: 1, marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* 1. Staff Identity Card */}
        {loading ? (
          <div style={{
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "13px",
          }}>
            Loading staff profile...
          </div>
        ) : !data?.hasStaffRecord ? (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            color: "#fca5a5",
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "13px" }}>
              <strong>Staff Profile Not Found</strong>
              <p style={{ margin: "4px 0 0", color: "#f87171", fontSize: "12px" }}>
                {data?.message ?? "Your system login is not linked to a physical employee record. Please contact HR."}
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(11, 31, 58, 0.9) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: "bold",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
            }}>
              {staffInfo.firstName?.[0] ?? "U"}{staffInfo.lastName?.[0] ?? ""}
            </div>

            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {staffInfo.fullName}
                </h2>
                <span style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: "600",
                }}>
                  {staffInfo.staffNumber}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", fontSize: "12px", color: "#cbd5e1" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <User size={12} style={{ color: "#94a3b8" }} />
                  {staffInfo.positionName}
                </span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Building2 size={12} style={{ color: "#94a3b8" }} />
                  {staffInfo.homeStation?.name ?? "Main HQ"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Live Digital Clock Panel */}
        <div style={{
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(7, 19, 37, 0.95) 100%)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
        }}>
          <div style={{
            fontSize: "12px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            color: "#94a3b8",
            marginBottom: "6px",
          }}>
            {currentDate || "Loading Date..."}
          </div>

          <div style={{
            fontSize: "44px",
            fontWeight: "800",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            color: "#ffffff",
            letterSpacing: "1px",
            margin: "4px 0 12px",
            textShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
          }}>
            {currentTime || "00:00:00 AM"}
          </div>

          {/* GPS Location Pill */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${gpsStatus === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            padding: "8px 14px",
            borderRadius: "24px",
            fontSize: "12px",
            maxWidth: "100%",
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: gpsStatus === "success" ? "#10b981" : gpsStatus === "error" ? "#ef4444" : "#f59e0b",
              boxShadow: gpsStatus === "success" ? "0 0 8px #10b981" : "none",
              flexShrink: 0,
            }} />

            <span style={{ color: gpsStatus === "success" ? "#e2e8f0" : "#f87171", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {gpsStatus === "success" && coords
                ? `GPS Lock (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}) ±${coords.accuracy ?? 0}m`
                : gpsStatus === "error"
                ? (gpsErrorMessage || "GPS Fix Failed")
                : "Acquiring GPS fix..."}
            </span>

            <button
              type="button"
              onClick={requestLocation}
              style={{
                background: "none",
                border: "none",
                color: "#60a5fa",
                padding: "2px 4px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
              title="Refresh Location"
            >
              <RefreshCw size={13} className={gpsStatus === "acquiring" ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 3. Action Punch Buttons */}
        {data?.hasStaffRecord && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            
            {/* Notes Input */}
            {!isClockedOut && (
              <div>
                <textarea
                  style={{
                    width: "100%",
                    minHeight: "56px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#ffffff",
                    fontSize: "13px",
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder="Optional shift notes (e.g. Remote work, field assignment, vehicle #)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={busy}
                />
              </div>
            )}

            {/* Main Action Button */}
            {!isClockedIn ? (
              <button
                type="button"
                onClick={() => handleClock("in")}
                disabled={busy || !coords}
                style={{
                  width: "100%",
                  height: "56px",
                  borderRadius: "16px",
                  border: "none",
                  background: !coords
                    ? "rgba(16, 185, 129, 0.3)"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "17px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: !coords || busy ? "not-allowed" : "pointer",
                  boxShadow: !coords ? "none" : "0 8px 24px rgba(16, 185, 129, 0.4)",
                  transition: "all 0.2s ease",
                }}
              >
                <LogIn size={22} />
                <span>{busy ? "CLOCKING IN..." : "CLOCK IN NOW"}</span>
              </button>
            ) : !isClockedOut ? (
              <button
                type="button"
                onClick={() => handleClock("out")}
                disabled={busy || !coords}
                style={{
                  width: "100%",
                  height: "56px",
                  borderRadius: "16px",
                  border: "none",
                  background: !coords
                    ? "rgba(245, 158, 11, 0.3)"
                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "#ffffff",
                  fontSize: "17px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: !coords || busy ? "not-allowed" : "pointer",
                  boxShadow: !coords ? "none" : "0 8px 24px rgba(245, 158, 11, 0.4)",
                  transition: "all 0.2s ease",
                }}
              >
                <LogOut size={22} />
                <span>{busy ? "CLOCKING OUT..." : "CLOCK OUT NOW"}</span>
              </button>
            ) : (
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center",
                color: "#34d399",
              }}>
                <CheckCircle2 size={28} style={{ margin: "0 auto 6px" }} />
                <div style={{ fontWeight: "700", fontSize: "15px" }}>Shift Completed Today</div>
                <div style={{ fontSize: "12px", color: "#a7f3d0", marginTop: "2px" }}>
                  Your clock-in and clock-out logs are securely saved.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Shift Summary & Timeline */}
        {statusInfo && (
          <div style={{
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "18px",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
              paddingBottom: "10px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={15} style={{ color: "#3b82f6" }} />
                Today's Shift Punch Logs
              </span>
              {isClockedIn && (
                <span style={{
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#60a5fa",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                }}>
                  Duration: {statusInfo.shiftDurationFormatted}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              {/* Clock In Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: statusInfo.clockInAt ? "#10b981" : "#64748b",
                  }} />
                  <span style={{ color: "#94a3b8" }}>Clock In:</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ color: statusInfo.clockInAt ? "#ffffff" : "#64748b" }}>
                    {statusInfo.clockInAt ? new Date(statusInfo.clockInAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "Not Clocked In"}
                  </strong>
                  {statusInfo.clockInLatitude && statusInfo.clockInLongitude && (
                    <a
                      href={`https://www.google.com/maps?q=${statusInfo.clockInLatitude},${statusInfo.clockInLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", fontSize: "10px", color: "#60a5fa", textDecoration: "none", marginTop: "2px" }}
                    >
                      View Map Pin ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Clock Out Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: statusInfo.clockOutAt ? "#f59e0b" : "#64748b",
                  }} />
                  <span style={{ color: "#94a3b8" }}>Clock Out:</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ color: statusInfo.clockOutAt ? "#ffffff" : "#64748b" }}>
                    {statusInfo.clockOutAt ? new Date(statusInfo.clockOutAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "Not Clocked Out"}
                  </strong>
                  {statusInfo.clockOutLatitude && statusInfo.clockOutLongitude && (
                    <a
                      href={`https://www.google.com/maps?q=${statusInfo.clockOutLatitude},${statusInfo.clockOutLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", fontSize: "10px", color: "#60a5fa", textDecoration: "none", marginTop: "2px" }}
                    >
                      View Map Pin ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Mobile PWA Add To Home Screen Instructions */}
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px dashed rgba(255, 255, 255, 0.12)",
          borderRadius: "14px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#94a3b8",
          fontSize: "11px",
        }}>
          <Smartphone size={18} style={{ color: "#10b981", flexShrink: 0 }} />
          <div>
            <strong>Install on your Phone:</strong> Tap your mobile browser menu (Share or ⋮) and select <strong>"Add to Home Screen"</strong> to use as a native app.
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer style={{
        marginTop: "32px",
        textAlign: "center",
        fontSize: "11px",
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}>
        <ShieldCheck size={13} style={{ color: "#10b981" }} />
        <span>AAU Chamo Security & Audit Trail Active</span>
      </footer>
    </div>
  );
}
