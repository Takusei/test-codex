"use client";

import { useMemo, useState } from "react";

const fileTree = [
  {
    id: "overview",
    name: "Overview.pdf",
    description:
      "A high-level summary of the transaction, key milestones, and scope.",
  },
  {
    id: "financials",
    name: "Financials/2024-Q2.xlsx",
    description:
      "Quarterly performance highlights covering revenue, margin, and burn.",
  },
  {
    id: "customers",
    name: "Customers/Top-Accounts.pptx",
    description:
      "Customer profile snapshots including logos, contract values, and renewal dates.",
  },
  {
    id: "legal",
    name: "Legal/Compliance-Report.docx",
    description:
      "Regulatory posture, risk notes, and compliance audit outcomes.",
  },
  {
    id: "product",
    name: "Product/Roadmap.md",
    description:
      "Product delivery roadmap with milestones and investment priorities.",
  },
];

export default function RoomPage() {
  const [roomId, setRoomId] = useState("");
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [enteredRoomId, setEnteredRoomId] = useState<string | null>(null);

  const activeFile = useMemo(
    () => fileTree.find((file) => file.id === activeFileId) ?? null,
    [activeFileId]
  );

  const handleRoomAccess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId.trim()) {
      return;
    }
    setEnteredRoomId(roomId.trim());
    setActiveFileId(fileTree[0].id);
  };

  return (
    <main className="page room-page">
      <section className="card room-card">
        <div className="room-header">
          <div>
            <p className="eyebrow">Secure access</p>
            <h1>Choose a data room</h1>
            <p className="muted">
              Enter the room ID shared with you to load the secure file tree.
            </p>
          </div>
          <form className="room-form" onSubmit={handleRoomAccess}>
            <label className="field">
              <span>Room ID</span>
              <input
                type="text"
                placeholder="e.g. VDR-4821"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                required
              />
            </label>
            <button className="primary" type="submit">
              Access room
            </button>
          </form>
        </div>
        <div className="room-body">
          <aside className="file-tree">
            <div className="file-tree-header">
              <h2>Files</h2>
              <span className="chip">
                {enteredRoomId ? `Room ${enteredRoomId}` : "No room selected"}
              </span>
            </div>
            {enteredRoomId ? (
              <ul>
                {fileTree.map((file) => (
                  <li key={file.id}>
                    <button
                      className={
                        activeFileId === file.id
                          ? "file-link active"
                          : "file-link"
                      }
                      type="button"
                      onClick={() => setActiveFileId(file.id)}
                    >
                      {file.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Enter a room ID to view files.</p>
            )}
          </aside>
          <section className="file-preview">
            <div className="file-preview-header">
              <h2>Summary</h2>
              {activeFile ? (
                <span className="chip">{activeFile.name}</span>
              ) : null}
            </div>
            {activeFile ? (
              <div className="summary">
                <p>{activeFile.description}</p>
                <div className="summary-grid">
                  <div>
                    <h3>AI highlights</h3>
                    <ul>
                      <li>Auto-generated synopsis of the latest update.</li>
                      <li>Important stakeholders and dates flagged.</li>
                      <li>Key risks identified for follow-up review.</li>
                    </ul>
                  </div>
                  <div>
                    <h3>Next actions</h3>
                    <ul>
                      <li>Assign reviewer to validate assumptions.</li>
                      <li>Schedule Q&amp;A on any deviations.</li>
                      <li>Export summary for internal distribution.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">
                Select a file from the left to see a summary preview.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
