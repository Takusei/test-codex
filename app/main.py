"""Entry point for running the FastAPI GraphQL server."""
from __future__ import annotations

from fastapi import FastAPI, Request, Response
from strawberry.fastapi import GraphQLRouter

from .db import Base, engine, get_session
from .schema import schema


app = FastAPI(title="GraphQL Auth Service", version="0.2.0")


@app.on_event("startup")
async def startup_event() -> None:
    Base.metadata.create_all(bind=engine)


@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    session_generator = get_session()
    session = next(session_generator)
    request.state.db_session = session
    response: Response
    try:
        response = await call_next(request)
    finally:
        session.close()
        try:
            next(session_generator)
        except StopIteration:
            pass
    return response


async def get_context(request: Request):
    return {"request": request, "session": request.state.db_session}


graphql_router = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_router, prefix="/graphql")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
