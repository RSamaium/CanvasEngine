import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import canvasengine, { shaderLoader } from "../../packages/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: __dirname,
  plugins: [canvasengine(), shaderLoader()],
  publicDir: path.resolve(__dirname, "public"),
  resolve: {
    alias: {
      canvasengine: path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@canvasengine/presets": path.resolve(__dirname, "../../packages/presets/src/index.ts"),
      "@chenglou/pretext": path.resolve(
        __dirname,
        "../../packages/core/node_modules/@chenglou/pretext/dist/layout.js"
      ),
    },
  },
  server: {
    host: "127.0.0.1",
  },
});
