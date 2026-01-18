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
        return None
    return OpenAI(api_key=api_key)


def summarize_text(text: str) -> str:
    client = get_openai_client()
    if client is None:
        snippet = text[:300]
        return f"{snippet}..." if len(text) > 300 else snippet

    prompt = f"Summarize the following document in 3-5 bullet points:\n\n{text}"
    response = client.chat.completions.create(
        model="gpt-4o-mini",
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
    root_node = {"name": root_path_obj.name, "path": root_path, "children": []}
    tree_map[root_path] = root_node

    for row in rows:
        path_str = row[1]
        name = row[2]
        parent_path = row[3]
        tree_map.setdefault(
            parent_path,
            {"name": Path(parent_path).name, "path": parent_path, "children": []},
        )
        tree_map.setdefault(path_str, {"name": name, "path": path_str, "children": []})

        tree_map[parent_path]["children"].append(tree_map[path_str])

    for node_path, node in list(tree_map.items()):
        if node_path == root_path:
            continue
        parent_path = str(Path(node_path).parent)
        parent = tree_map.get(parent_path)
        if parent and node not in parent["children"]:
            parent["children"].append(node)

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
        if entry.size > MAX_FILE_BYTES or not is_text_file(entry.path):
            continue
        try:
            text = entry.path.read_text(encoding="utf-8")
        except OSError:
            continue
        summary = summarize_text(text)
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
