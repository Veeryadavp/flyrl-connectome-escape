import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/flyrl-connectome-escape/",
  plugins: [react()],
  server: {
    port: 5173
  }
});
