"""FastAPI + Strawberry GraphQL chatbot with login and streaming.

This module exposes login, chat mutation, chat streaming subscription, and
session reset capabilities. Each bearer token keeps its own conversation history
without sharing across users.
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import AsyncGenerator, Dict, List, Optional

from fastapi import FastAPI, Request, WebSocket
from fastapi.staticfiles import StaticFiles
from graphql import GraphQLError
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info
from strawberry.subscriptions import GRAPHQL_TRANSPORT_WS_PROTOCOL

app = FastAPI(title="LangChain Chatbot")


# Demo user store; replace with a persistent user system in production.
USER_DB = {"demo": "demo-password"}

# In-memory session history per token
_session_history: Dict[str, List[BaseMessage]] = {}
_token_users: Dict[str, str] = {}


class _AuthContext:
    """Context container for request authentication."""

    def __init__(self, token: Optional[str]):
        self.token = token


def _extract_token(headers: dict) -> Optional[str]:
    auth_header = headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.removeprefix("Bearer ").strip()
    return None


async def get_context(
    request: Optional[Request] = None,
    websocket: Optional[WebSocket] = None,
    connection_params: Optional[dict] = None,
) -> dict:
    """Extract bearer token from HTTP or WebSocket headers or connection params."""

    headers = {}
    if request is not None:
        headers = request.headers
    elif websocket is not None:
        headers = websocket.headers

    token = _extract_token(headers)

    if not token and connection_params:
        # When using graphql-ws clients, the token can be provided via connection params.
        token = _extract_token(connection_params)

    return {"request": request or websocket, "auth": _AuthContext(token)}


def _build_llm(streaming: bool = False) -> ChatOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise GraphQLError("OPENAI_API_KEY not set")
    return ChatOpenAI(api_key=api_key, temperature=0.3, streaming=streaming)


def _require_token(info: Info) -> str:
    auth: _AuthContext = info.context.get("auth")
    token = auth.token if auth else None
    if not token or token not in _token_users:
        raise GraphQLError("Unauthorized: missing or invalid token.")
    return token


def _get_history(token: str) -> List[BaseMessage]:
    return _session_history.setdefault(token, [])


def _store_exchange(token: str, human: str, ai: str) -> None:
    history = _get_history(token)
    history.append(HumanMessage(content=human))
    history.append(AIMessage(content=ai))


@strawberry.type
class ChatPayload:
    """Chatbot reply payload."""

    reply: str


@strawberry.type
class ResetPayload:
    """Session reset confirmation payload."""

    message: str


@strawberry.type
class AuthPayload:
    """Authentication response payload."""

    token: str
    message: str


@strawberry.type
class Query:
    """GraphQL queries."""

    status: str = "LangChain chatbot GraphQL endpoint is running."


@strawberry.type
class Mutation:
    """GraphQL mutations for authentication and chat."""

    @strawberry.mutation
    def login(self, username: str, password: str) -> AuthPayload:
        expected_password = USER_DB.get(username)
        if expected_password is None or expected_password != password:
            raise GraphQLError("Invalid username or password.")

        token = uuid.uuid4().hex
        _token_users[token] = username
        _session_history.pop(token, None)
        return AuthPayload(
            token=token, message="Login successful. Use the token as a Bearer header."
        )

    @strawberry.mutation
    def chat(self, info: Info, message: str) -> ChatPayload:
        token = _require_token(info)
        history = list(_get_history(token))
        llm = _build_llm()
        result = llm.invoke(history + [HumanMessage(content=message)])
        _store_exchange(token, human=message, ai=result.content)
        return ChatPayload(reply=result.content)

    @strawberry.mutation
    def reset_session(self, info: Info) -> ResetPayload:
        token = _require_token(info)
        _session_history.pop(token, None)
        return ResetPayload(message="Session reset for current user token.")


@strawberry.type
class Subscription:
    """GraphQL subscriptions for streaming chat responses."""

    @strawberry.subscription
    async def chat_stream(self, info: Info, message: str) -> AsyncGenerator[str, None]:
        token = _require_token(info)
        history = list(_get_history(token))
        llm = _build_llm(streaming=True)

        accumulated = ""
        async for chunk in llm.astream(history + [HumanMessage(content=message)]):
            text = chunk.content or ""
            accumulated += text
            if text:
                yield text

        _store_exchange(token, human=message, ai=accumulated)


schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
    subscription_protocols=[GRAPHQL_TRANSPORT_WS_PROTOCOL],
)

app.include_router(graphql_app, prefix="/graphql")
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/frontend", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/")
def read_root() -> dict:
    return {"message": "GraphQL endpoint available at /graphql"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
