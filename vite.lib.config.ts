import { defineConfig } from "vite";
export default defineConfig({
  publicDir: false,
  build: {
    outDir: "lib",
    lib: {
      entry: {
        "domino-ui": "src/lib/index.ts",
        "native-tap-policy": "src/lib/native-tap-policy.ts",
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
