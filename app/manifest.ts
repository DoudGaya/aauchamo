import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AAU Chamo Attendance Punch Clock",
    short_name: "AAU Clock",
    description: "Mobile-first PWA attendance punch-clock and shift verification app for staff.",
    start_url: "/attendance",
    display: "standalone",
    background_color: "#071325",
    theme_color: "#0b1f3a",
    orientation: "portrait",
    icons: [
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcuts: [
      {
        name: "Clock In / Clock Out",
        short_name: "Punch Clock",
        description: "Open the mobile attendance punch clock",
        url: "/attendance",
      },
      {
        name: "ERP Operations Suite",
        short_name: "AAU ERP",
        description: "Open the main operations workspace",
        url: "/",
      },
    ],
  };
}
