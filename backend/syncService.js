const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const OpenAI = require("openai");

const MAX_FILE_BYTES = 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".html",
  ".css",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".rb",
  ".yml",
  ".yaml"
]);

function getDb(rootPath) {
  const dbPath = path.join(rootPath, "vdr.sqlite");
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE,
      name TEXT,
      parent_path TEXT,
      size_bytes INTEGER,
      updated_at TEXT,
      summary TEXT
    );
  `);
  return db;
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

async function summarizeText(text) {
  const client = getOpenAIClient();
  if (!client) {
    return text.slice(0, 300) + (text.length > 300 ? "..." : "");
  }

  const prompt = `Summarize the following document in 3-5 bullet points:\n\n${text}`;
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  return response.choices[0]?.message?.content?.trim() || "";
}

function walkDirectory(rootPath) {
  const entries = [];
  const stack = [rootPath];

  while (stack.length > 0) {
    const currentPath = stack.pop();
    const stats = fs.statSync(currentPath);

    if (stats.isDirectory()) {
      const children = fs.readdirSync(currentPath);
      for (const child of children) {
        stack.push(path.join(currentPath, child));
      }
    } else if (stats.isFile()) {
      entries.push({
        path: currentPath,
        size: stats.size
      });
    }
  }

  return entries;
}

async function syncFolder(rootPath) {
  const db = getDb(rootPath);
  const files = walkDirectory(rootPath);
  const insert = db.prepare(`
    INSERT INTO files (path, name, parent_path, size_bytes, updated_at, summary)
    VALUES (@path, @name, @parent_path, @size_bytes, @updated_at, @summary)
    ON CONFLICT(path) DO UPDATE SET
      name=excluded.name,
      parent_path=excluded.parent_path,
      size_bytes=excluded.size_bytes,
      updated_at=excluded.updated_at,
      summary=excluded.summary
  `);

  const now = new Date().toISOString();

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES || !isTextFile(file.path)) {
      continue;
    }

    let text = "";
    try {
      text = fs.readFileSync(file.path, "utf8");
    } catch (error) {
      console.warn(`Skipping ${file.path}: ${error.message}`);
      continue;
    }

    const summary = await summarizeText(text);
    insert.run({
      path: file.path,
      name: path.basename(file.path),
      parent_path: path.dirname(file.path),
      size_bytes: file.size,
      updated_at: now,
      summary
    });
  }

  const data = loadTree(rootPath);
  db.close();
  return data;
}

function loadTree(rootPath) {
  const db = getDb(rootPath);
  const rows = db.prepare("SELECT * FROM files ORDER BY path").all();
  db.close();

  const treeMap = new Map();
  const rootNode = { name: path.basename(rootPath), path: rootPath, children: [] };
  treeMap.set(rootPath, rootNode);

  for (const row of rows) {
    const parentPath = row.parent_path;
    if (!treeMap.has(parentPath)) {
      treeMap.set(parentPath, { name: path.basename(parentPath), path: parentPath, children: [] });
    }
    if (!treeMap.has(row.path)) {
      treeMap.set(row.path, { name: row.name, path: row.path, children: [] });
    }

    const parentNode = treeMap.get(parentPath);
    const node = treeMap.get(row.path);
    parentNode.children.push(node);
  }

  for (const [nodePath, node] of treeMap.entries()) {
    if (nodePath === rootPath) {
      continue;
    }
    const parentPath = path.dirname(nodePath);
    if (treeMap.has(parentPath)) {
      const parentNode = treeMap.get(parentPath);
      if (!parentNode.children.includes(node)) {
        parentNode.children.push(node);
      }
    }
  }

  return {
    rootPath,
    tree: rootNode,
    files: rows
  };
}

module.exports = {
  syncFolder,
  loadTree
};
