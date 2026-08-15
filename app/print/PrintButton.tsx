"use client";

import React from "react";

export function PrintButton({ label, className }: { label: string; className?: string }) {
  return (
    <button className={className} onClick={() => window.print()}>
      {label}
    </button>
  );
}
