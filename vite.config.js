import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "prompt",
      injectRegister: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"]
      },
      manifest: {
        id: "/admin",
        name: "OnlinDC Admin",
        short_name: "OnlinDC",
        description: "Onlin.in diagnostic, CRM and sales workspace",
        start_url: "/admin",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#f5f7fa",
        theme_color: "#195FA6",
        categories: ["business", "productivity"],
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 3000
  }
});
