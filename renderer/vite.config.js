const { resolve } = require("path");
const react = require("@vitejs/plugin-react");

module.exports = {
  root: resolve(__dirname),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "..", "dist", "renderer"),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
};
