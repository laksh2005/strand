import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/events": "http://localhost:4000",
      "/permissions": "http://localhost:4000",
      "/audit-log": "http://localhost:4000",
    },
  },
});
