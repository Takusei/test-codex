from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from service import load_tree, sync_folder

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SyncRequest(BaseModel):
    rootPath: str


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/tree")
async def tree(rootPath: str | None = None) -> dict:
    if not rootPath:
        raise HTTPException(status_code=400, detail="rootPath is required")
    return load_tree(rootPath)


@app.post("/sync")
async def sync(payload: SyncRequest) -> dict:
    if not payload.rootPath:
        raise HTTPException(status_code=400, detail="rootPath is required")
    return await sync_folder(payload.rootPath)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("VDR_PORT", "4310"))
    uvicorn.run("app:app", host="127.0.0.1", port=port, reload=False)
