# GraphQL Auth Service

This project provides a FastAPI-based GraphQL service that supports registering and logging in users backed by a MySQL database. It uses Strawberry for GraphQL execution, SQLAlchemy for ORM, and JWT tokens for authentication responses.

## Prerequisites
- Python 3.11+
- MySQL database

## Setup
1. Install dependencies with [uv](https://github.com/astral-sh/uv):
   ```bash
   uv sync
   ```
2. Configure environment variables (examples):
   ```bash
   export DATABASE_URL="mysql+pymysql://user:password@localhost:3306/app_db"
   export SECRET_KEY="super-secret-key"
   export ACCESS_TOKEN_EXPIRE_MINUTES=120
   ```

## Running the server
Start the ASGI server with uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

GraphQL Playground is available at `http://localhost:8000/graphql`.

## Example operations
### Register
```graphql
mutation {
  register(username: "alice", email: "alice@example.com", password: "mypassword") {
    token
    user {
      id
      username
      email
      createdAt
    }
  }
}
```

### Login
```graphql
mutation {
  login(username: "alice", password: "mypassword") {
    token
    user {
      id
      username
      email
      createdAt
    }
  }
}
```

### Query user
```graphql
query {
  me(username: "alice") {
    id
    username
    email
    createdAt
  }
}
```

## Database schema
Tables are automatically created on startup. The `users` table stores usernames, emails, hashed passwords, and timestamps.
