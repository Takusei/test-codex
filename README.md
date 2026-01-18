# test-codex

## VDR Desktop App (Electron + React)

This project scaffolds an Electron desktop app with a React renderer and a local Node.js backend.

### Features
- Select a local folder from the Electron UI.
- Load an existing `vdr.sqlite` index if present.
- Sync to build a tree + file summaries using OpenAI (fallbacks to a short snippet if no API key).

### Setup

```bash
npm install
```

### Development

```bash
npm run dev
```

This launches the Vite dev server and Electron.

### Environment Variables

- `OPENAI_API_KEY` - Used to summarize files via OpenAI.
- `VDR_PORT` - Backend API port (default `4310`).
