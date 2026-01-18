const { resolve } = require("path");
const react = require("@vitejs/plugin-react");

module.exports = {
  root: resolve(__dirname),
  base: "./", // Use relative paths for assets
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "..", "dist"), // Output to root dist folder
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
};
