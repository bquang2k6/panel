import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Locketwan Admin Dashboard",
    short_name: "Locketwan Admin",
    description: "Bảng quản trị hệ thống Locketwan",
    start_url: "/admin",
    scope: "/",
    id: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone", "minimal-ui"],
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["admin", "dashboard", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/opengraph-image.png",
        sizes: "1200x630",
        type: "image/png",
      },
    ],
  };
}
