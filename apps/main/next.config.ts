import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.4"],
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  output: "standalone",
};

export default nextConfig;
