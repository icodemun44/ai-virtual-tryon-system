import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        result: resolve(__dirname, "public/result.html"),
        background: resolve(__dirname, "src/background.js"),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "background" ? "[name].js" : "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
  publicDir: "public",
});
