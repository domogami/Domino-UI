import { defineConfig } from "vite";
export default defineConfig({
  publicDir: false,
  build: {
    outDir: "lib",
    lib: {
      entry: "src/lib/index.ts",
      formats: ["es"],
      fileName: "domino-ui",
      cssFileName: "domino-ui",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@lucasmarkes/hairline",
      ],
    },
  },
});
