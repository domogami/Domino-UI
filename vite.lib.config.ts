import { defineConfig } from "vite";
export default defineConfig({
  publicDir: false,
  build: {
    outDir: "lib",
    lib: {
      entry: {
        "domino-ui": "src/lib/index.ts",
        "story-tools": "src/lib/story-tools.tsx",
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
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
