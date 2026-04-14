import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) return "charts-vendor";
            if (id.includes("@supabase")) return "supabase-vendor";
            if (id.includes("framer-motion") || id.includes("motion")) return "motion-vendor";
            if (id.includes("@radix-ui")) return "radix-vendor";
            if (id.includes("html2canvas") || id.includes("jszip")) return "export-vendor";
            if (id.includes("react") || id.includes("scheduler")) return "react-vendor";
          }
        },
      },
    },
  },
}));
