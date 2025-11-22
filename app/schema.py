"""GraphQL schema and resolvers implemented with Strawberry."""

from __future__ import annotations

from typing import Optional

import strawberry
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from strawberry.permission import BasePermission
from strawberry.types import Info

from .auth import (
    create_access_token,
    get_username_from_token,
    hash_password,
    verify_password,
)
from .models import User


class IsAuthenticated(BasePermission):
    message = "User is not authenticated"

    def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        request = info.context["request"]
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            username = get_username_from_token(token)
            if username:
                session: Session = info.context["session"]
                user = session.query(User).filter_by(username=username).first()
                if user:
                    # Attach user to context for easy access in resolver
                    info.context["user"] = user
                    return True
        return False


def _to_user_type(user: User) -> "UserType":
    return UserType(
        id=str(user.id),
        username=user.username,
        email=user.email,
        created_at=user.created_at.isoformat(),
    )


@strawberry.type
class UserType:
    """GraphQL representation of the ``User`` model."""

    id: strawberry.ID
    username: str
    email: Optional[str]
    created_at: str = strawberry.field(name="createdAt")


@strawberry.type
class AuthPayload:
    """Return shape for authentication mutations."""

    user: UserType
    token: str


@strawberry.type
class Query:
    @strawberry.field(permission_classes=[IsAuthenticated])
    def me(self, info: Info) -> Optional[UserType]:
        current_user: User = info.context["user"]
        return _to_user_type(current_user)


@strawberry.type
class Mutation:
    @strawberry.mutation
    def register(
        self,
        info: Info,
        username: str,
        password: str,
        email: Optional[str] = None,
    ) -> AuthPayload:
        session: Session = info.context["session"]
        new_user = User(
            username=username, email=email, password_hash=hash_password(password)
        )
        session.add(new_user)
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise ValueError("Username or email already exists") from exc

        token = create_access_token({"sub": new_user.username})
        return AuthPayload(user=_to_user_type(new_user), token=token)

    @strawberry.mutation
    def login(self, info: Info, username: str, password: str) -> AuthPayload:
        session: Session = info.context["session"]
        user = session.query(User).filter_by(username=username).first()
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Invalid username or password")

        token = create_access_token({"sub": user.username})
        return AuthPayload(user=_to_user_type(user), token=token)


schema = strawberry.Schema(query=Query, mutation=Mutation)
