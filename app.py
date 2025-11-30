"""Entrypoint for the LangChain chatbot backend.

This module re-exports the FastAPI app defined in ``backend/main.py`` so running
``uvicorn app:app`` continues to work as before.
"""
from backend.main import app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
