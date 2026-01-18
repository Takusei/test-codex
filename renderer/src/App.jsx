import React, { useMemo, useState } from "react";

const API_BASE = "http://localhost:4310";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function TreeNode({ node, level = 0 }) {
  const padding = `${level * 12}px`;
  return (
    <div className="tree-node" style={{ paddingLeft: padding }}>
      <span className="tree-name">{node.name}</span>
      {node.children?.length > 0 && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [rootPath, setRootPath] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectFolder = async () => {
    setError("");
    if (!window.electronAPI?.selectFolder) {
      setError("Electron API unavailable. Run inside Electron.");
      return;
    }

    const selected = await window.electronAPI.selectFolder();
    if (!selected) {
      return;
    }

    setRootPath(selected);
    await fetchTree(selected);
  };

  const fetchTree = async (folderPath) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/tree?rootPath=${encodeURIComponent(folderPath)}`
      );
      if (!response.ok) {
        throw new Error("No existing index found. Please sync.");
      }
      const data = await response.json();
      setTreeData(data);
    } catch (err) {
      setTreeData(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!rootPath) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootPath })
      });
      if (!response.ok) {
        throw new Error("Sync failed.");
      }
      const data = await response.json();
      setTreeData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const files = useMemo(() => treeData?.files || [], [treeData]);

  if (!rootPath) {
    return (
      <div className="page">
        <header className="header">
          <h1>Virtual Data Room</h1>
          <p>Select a local folder to load its VDR index.</p>
        </header>
        <button className="primary" onClick={handleSelectFolder}>
          Select Folder
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Virtual Data Room</h1>
          <p className="muted">{rootPath}</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={handleSelectFolder}>
            Change Folder
          </button>
          <button className="primary" onClick={handleSync} disabled={loading}>
            {loading ? "Syncing..." : "Sync"}
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="layout">
        <aside className="sidebar">
          <h2>Folder Tree</h2>
          {treeData?.tree ? (
            <TreeNode node={treeData.tree} />
          ) : (
            <p className="muted">No index found. Click Sync to generate.</p>
          )}
        </aside>
        <main className="content">
          <h2>File Summaries</h2>
          <div className="table">
            <div className="table-row table-header">
              <span>File</span>
              <span>Summary</span>
              <span>Size</span>
              <span>Updated</span>
            </div>
            {files.map((file) => (
              <div className="table-row" key={file.path}>
                <span className="mono">{file.path}</span>
                <span>{file.summary || "-"}</span>
                <span>{formatBytes(file.size_bytes)}</span>
                <span>{file.updated_at || "-"}</span>
              </div>
            ))}
            {files.length === 0 && (
              <div className="table-row empty">No data yet.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
