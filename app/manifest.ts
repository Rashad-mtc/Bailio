import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "LoyerFacile", short_name: "LoyerFacile", description: "Gestion locative et paiement de loyer", start_url: "/", display: "standalone", background_color: "#f7f8fc", theme_color: "#5b2c87", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }] };
}
