import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AAU Chamo Operations Suite",
    short_name: "AAU Chamo",
    description: "Centralized inventory, sales, cargo, finance and operations management.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f8",
    theme_color: "#0b1f3a",
    orientation: "any",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
