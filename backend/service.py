from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - optional dependency
    OpenAI = None

MAX_FILE_BYTES = 1024 * 1024
TEXT_EXTENSIONS = {
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
    ".yaml",
}


@dataclass
class FileEntry:
    path: Path
    size: int


def get_db(root_path: str) -> sqlite3.Connection:
    db_path = Path(root_path) / "vdr.sqlite"
    conn = sqlite3.connect(db_path)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE,
            name TEXT,
            parent_path TEXT,
            size_bytes INTEGER,
            updated_at TEXT,
            summary TEXT
        );
        """
    )
    conn.commit()
    return conn


def is_text_file(file_path: Path) -> bool:
    return file_path.suffix.lower() in TEXT_EXTENSIONS


def get_openai_client() -> OpenAI | None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or OpenAI is None:
        print(
            "OpenAI API key not found or OpenAI library not installed; skipping summaries."
        )
        return None
    return OpenAI(api_key=api_key)


def summarize_text(text: str) -> str:
    client = get_openai_client()
    if client is None:
        snippet = text[:300]
        return f"{snippet}..." if len(text) > 300 else snippet

    prompt = f"Summarize the following document in 3-5 bullet points:\n\n{text}"
    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    return response.choices[0].message.content.strip() if response.choices else ""


def walk_directory(root_path: str) -> Iterable[FileEntry]:
    root = Path(root_path)
    for file_path in root.rglob("*"):
        if file_path.is_file():
            try:
                size = file_path.stat().st_size
            except OSError:
                continue
            yield FileEntry(path=file_path, size=size)


def load_tree(root_path: str) -> dict:
    conn = get_db(root_path)
    cursor = conn.execute("SELECT * FROM files ORDER BY path")
    rows = cursor.fetchall()
    conn.close()

    tree_map: dict[str, dict] = {}
    root_path_obj = Path(root_path)
    root_node = {
        "name": root_path_obj.name,
        "path": str(root_path_obj),
        "children": [],
    }
    tree_map[str(root_path_obj)] = root_node

    # Create all directory nodes first
    for row in rows:
        path_str = row[1]
        path_obj = Path(path_str)
        for p in path_obj.parents:
            if str(p) == root_path:
                break
            if str(p) not in tree_map:
                tree_map[str(p)] = {
                    "name": p.name,
                    "path": str(p),
                    "children": [],
                }

    # Add file nodes and attach all nodes to parents
    for row in rows:
        path_str = row[1]
        name = row[2]
        parent_path = row[3]
        file_node = {"name": name, "path": path_str, "children": []}
        tree_map[path_str] = file_node

        if parent_path in tree_map:
            parent_node = tree_map[parent_path]
            if file_node not in parent_node["children"]:
                parent_node["children"].append(file_node)

    # Attach directories to their parents
    for path, node in tree_map.items():
        if path == str(root_path_obj):
            continue
        parent_path = str(Path(path).parent)
        if parent_path in tree_map and parent_path != path:
            parent_node = tree_map[parent_path]
            if node not in parent_node["children"]:
                parent_node["children"].append(node)

    # Sort children by name
    for node in tree_map.values():
        node["children"].sort(key=lambda x: x["name"])

    files = [
        {
            "id": row[0],
            "path": row[1],
            "name": row[2],
            "parent_path": row[3],
            "size_bytes": row[4],
            "updated_at": row[5],
            "summary": row[6],
        }
        for row in rows
    ]

    return {"rootPath": root_path, "tree": root_node, "files": files}


async def sync_folder(root_path: str) -> dict:
    conn = get_db(root_path)
    insert_sql = (
        "INSERT INTO files (path, name, parent_path, size_bytes, updated_at, summary) "
        "VALUES (?, ?, ?, ?, ?, ?) "
        "ON CONFLICT(path) DO UPDATE SET "
        "name=excluded.name, "
        "parent_path=excluded.parent_path, "
        "size_bytes=excluded.size_bytes, "
        "updated_at=excluded.updated_at, "
        "summary=excluded.summary"
    )
    now = datetime.utcnow().isoformat()

    for entry in walk_directory(root_path):
        summary = ""
        if entry.size <= MAX_FILE_BYTES and is_text_file(entry.path):
            try:
                text = entry.path.read_text(encoding="utf-8")
                summary = summarize_text(text)
            except OSError:
                pass  # Keep summary empty if read fails
        else:
            summary = f"File type: {entry.path.suffix}"

        conn.execute(
            insert_sql,
            (
                str(entry.path),
                entry.path.name,
                str(entry.path.parent),
                entry.size,
                now,
                summary,
            ),
        )
    conn.commit()
    conn.close()
    return load_tree(root_path)
