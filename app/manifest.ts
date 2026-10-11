import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DhakaFlix Media",
    short_name: "DhakaFlix",
    description: "High-Speed BDIX Media Discovery & Streaming Portal",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0e0f",
    theme_color: "#FF2121",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
