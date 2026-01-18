const express = require("express");
const cors = require("cors");
const { syncFolder, loadTree } = require("./syncService");

const PORT = process.env.VDR_PORT || 4310;
let server;

async function startServer() {
  if (server) {
    return server;
  }

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/tree", async (req, res) => {
    try {
      const { rootPath } = req.query;
      if (!rootPath) {
        return res.status(400).json({ error: "rootPath is required" });
      }

      const data = await loadTree(rootPath);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/sync", async (req, res) => {
    try {
      const { rootPath } = req.body;
      if (!rootPath) {
        return res.status(400).json({ error: "rootPath is required" });
      }

      const data = await syncFolder(rootPath);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  server = app.listen(PORT, () => {
    console.log(`VDR backend listening on ${PORT}`);
  });

  return server;
}

module.exports = { startServer };
