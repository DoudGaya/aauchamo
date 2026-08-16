"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Smartphone,
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
          setGpsErrorMessage("GPS access denied. Please enable location permissions in browser settings.");
        } else {
          setGpsErrorMessage("Unable to acquire high-accuracy GPS fix. Step outside or retry.");
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
      backgroundColor: "#f8fafc",
      color: "#111827",
      fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", Arial, sans-serif',
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "16px 16px 32px",
      maxWidth: "500px",
      margin: "0 auto",
      position: "relative",
    }}>
      {/* AAU Chamo Crimson Top Bar Accent */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "5px",
        background: "linear-gradient(90deg, #ca0b12 0%, #b00a10 100%)",
      }} />

      {/* Top Header */}
      <header style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0 16px",
        borderBottom: "1px solid #e5e7eb",
        marginTop: "4px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image
            src="/aauchamo-logo.png"
            alt="AAU Chamo Logo"
            width={140}
            height={36}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "#ffffff",
            border: "1px solid #d1d5db",
            color: "#374151",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            textDecoration: "none",
            fontWeight: "600",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          }}
        >
          <ChevronLeft size={14} />
          <span>Full ERP</span>
        </Link>
      </header>

      {/* Main Container */}
      <main style={{ width: "100%", marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* 1. Staff Identity Card (Branded) */}
        {loading ? (
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "13px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}>
            Loading staff profile...
          </div>
        ) : !data?.hasStaffRecord ? (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            color: "#991b1b",
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px", color: "#ca0b12" }} />
            <div style={{ fontSize: "13px" }}>
              <strong>Staff Profile Not Found</strong>
              <p style={{ margin: "4px 0 0", color: "#b91c1c", fontSize: "12px" }}>
                {data?.message ?? "Your system login is not linked to a physical employee record. Please contact HR."}
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "4px",
              background: "#ca0b12",
            }} />

            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ca0b12 0%, #b00a10 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: "700",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(202, 11, 18, 0.25)",
            }}>
              {staffInfo.firstName?.[0] ?? "U"}{staffInfo.lastName?.[0] ?? ""}
            </div>

            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {staffInfo.fullName}
                </h2>
                <span style={{
                  background: "rgba(202, 11, 18, 0.08)",
                  color: "#ca0b12",
                  border: "1px solid rgba(202, 11, 18, 0.2)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: "700",
                }}>
                  {staffInfo.staffNumber}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", fontSize: "12px", color: "#4b5563" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <User size={12} style={{ color: "#ca0b12" }} />
                  {staffInfo.positionName}
                </span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Building2 size={12} style={{ color: "#ca0b12" }} />
                  {staffInfo.homeStation?.name ?? "Main HQ"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Live Digital Clock Panel (Branded Surface) */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "20px",
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
        }}>
          <div style={{
            fontSize: "12px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            color: "#6b7280",
            marginBottom: "6px",
          }}>
            {currentDate || "Loading Date..."}
          </div>

          <div style={{
            fontSize: "44px",
            fontWeight: "800",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            color: "#ca0b12",
            letterSpacing: "1px",
            margin: "4px 0 12px",
          }}>
            {currentTime || "00:00:00 AM"}
          </div>

          {/* GPS Location Pill */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#f9fafb",
            border: `1px solid ${gpsStatus === "success" ? "#bbf7d0" : "#fca5a5"}`,
            padding: "8px 14px",
            borderRadius: "24px",
            fontSize: "12px",
            maxWidth: "100%",
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: gpsStatus === "success" ? "#166534" : gpsStatus === "error" ? "#ca0b12" : "#d97706",
              boxShadow: gpsStatus === "success" ? "0 0 8px #166534" : "none",
              flexShrink: 0,
            }} />

            <span style={{ color: gpsStatus === "success" ? "#166534" : "#991b1b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "600" }}>
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
                color: "#ca0b12",
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
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#111827",
                    fontSize: "13px",
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  }}
                  placeholder="Optional shift notes (e.g. Remote work, field assignment, station duty)..."
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
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #166534 0%, #15803d 100%)",
                  color: "#ffffff",
                  fontSize: "17px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: !coords || busy ? "not-allowed" : "pointer",
                  boxShadow: !coords ? "none" : "0 6px 20px rgba(22, 101, 52, 0.3)",
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
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #ca0b12 0%, #b00a10 100%)",
                  color: "#ffffff",
                  fontSize: "17px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: !coords || busy ? "not-allowed" : "pointer",
                  boxShadow: !coords ? "none" : "0 6px 20px rgba(202, 11, 18, 0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                <LogOut size={22} />
                <span>{busy ? "CLOCKING OUT..." : "CLOCK OUT NOW"}</span>
              </button>
            ) : (
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center",
                color: "#166534",
              }}>
                <CheckCircle2 size={28} style={{ margin: "0 auto 6px", color: "#166534" }} />
                <div style={{ fontWeight: "700", fontSize: "15px" }}>Shift Completed Today</div>
                <div style={{ fontSize: "12px", color: "#15803d", marginTop: "2px" }}>
                  Your clock-in and clock-out timestamps are securely recorded.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Shift Summary & Timeline */}
        {statusInfo && (
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "18px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
              paddingBottom: "10px",
              borderBottom: "1px solid #f3f4f6",
            }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={15} style={{ color: "#ca0b12" }} />
                Today's Shift Punch Logs
              </span>
              {isClockedIn && (
                <span style={{
                  background: "rgba(202, 11, 18, 0.08)",
                  color: "#ca0b12",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
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
                    background: statusInfo.clockInAt ? "#166534" : "#9ca3af",
                  }} />
                  <span style={{ color: "#4b5563" }}>Clock In:</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ color: statusInfo.clockInAt ? "#111827" : "#9ca3af" }}>
                    {statusInfo.clockInAt ? new Date(statusInfo.clockInAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "Not Clocked In"}
                  </strong>
                  {statusInfo.clockInLatitude && statusInfo.clockInLongitude && (
                    <a
                      href={`https://www.google.com/maps?q=${statusInfo.clockInLatitude},${statusInfo.clockInLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", fontSize: "10px", color: "#ca0b12", textDecoration: "none", fontWeight: "600", marginTop: "2px" }}
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
                    background: statusInfo.clockOutAt ? "#ca0b12" : "#9ca3af",
                  }} />
                  <span style={{ color: "#4b5563" }}>Clock Out:</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ color: statusInfo.clockOutAt ? "#111827" : "#9ca3af" }}>
                    {statusInfo.clockOutAt ? new Date(statusInfo.clockOutAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "Not Clocked Out"}
                  </strong>
                  {statusInfo.clockOutLatitude && statusInfo.clockOutLongitude && (
                    <a
                      href={`https://www.google.com/maps?q=${statusInfo.clockOutLatitude},${statusInfo.clockOutLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", fontSize: "10px", color: "#ca0b12", textDecoration: "none", fontWeight: "600", marginTop: "2px" }}
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
          background: "#ffffff",
          border: "1px dashed #d1d5db",
          borderRadius: "14px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#4b5563",
          fontSize: "11px",
        }}>
          <Smartphone size={18} style={{ color: "#ca0b12", flexShrink: 0 }} />
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
        color: "#9ca3af",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}>
        <ShieldCheck size={13} style={{ color: "#ca0b12" }} />
        <span>AAU Chamo Security & Audit Trail Active</span>
      </footer>
    </div>
  );
}
