"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

// The BeforeInstallPromptEvent interface is not standard in TS yet, so we type it as any or custom
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) {
    return null;
  }

  return (
    <button 
      type="button" 
      onClick={handleInstallClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: "100%",
        marginTop: "16px",
        padding: "12px",
        background: "rgba(0, 0, 0, 0.04)",
        color: "inherit",
        border: "1px dashed rgba(0, 0, 0, 0.2)",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 500,
        fontSize: "14px",
        transition: "background 0.2s"
      }}
      onMouseOver={(e) => e.currentTarget.style.background = "rgba(0, 0, 0, 0.08)"}
      onMouseOut={(e) => e.currentTarget.style.background = "rgba(0, 0, 0, 0.04)"}
    >
      <Download size={18} />
      Install AAU Chamo Desktop / Mobile App
    </button>
  );
}
