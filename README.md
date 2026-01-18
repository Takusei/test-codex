# test-codex

## VDR Desktop App (Electron + React)

This project scaffolds an Electron desktop app with a React renderer and a local FastAPI backend.

### Features
- Select a local folder from the Electron UI.
- Load an existing `vdr.sqlite` index if present.
- Sync to build a tree + file summaries using OpenAI (fallbacks to a short snippet if no API key).

### Setup

```bash
npm install
```

### Python Backend Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### Development

```bash
npm run dev
```

This launches the Vite dev server and Electron. The Electron main process starts the FastAPI backend.

### Environment Variables

- `OPENAI_API_KEY` - Used to summarize files via OpenAI.
- `VDR_PORT` - Backend API port (default `4310`).
