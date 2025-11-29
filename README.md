# LangChain Chatbot (GraphQL + Frontend)

GraphQL-based chatbot using LangChain, FastAPI, and OpenAI. Users log in to get
bearer tokens, then chat via GraphQL mutations or streaming subscriptions while
per-token conversation history is preserved.

## Project layout
- `backend/`: FastAPI + Strawberry GraphQL app with login, chat, streaming
  subscription, and session reset.
- `frontend/`: Minimal HTML pages for login and a ChatGPT-style UI with
  streaming replies.
- `app.py`: Convenience entrypoint that re-exports the FastAPI app.

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Set your OpenAI API key:

   ```bash
   export OPENAI_API_KEY="sk-..."
   ```

3. Run the server:

   ```bash
   uvicorn app:app --reload
   ```

The GraphQL Playground is available at `http://localhost:8000/graphql` and the
frontend pages at `http://localhost:8000/frontend/login.html` and
`http://localhost:8000/frontend/chat.html`.

## GraphQL usage

### 1. Login to get a token

Use the built-in demo user (`demo` / `demo-password`) to get a bearer token.

```graphql
mutation Login {
  login(username: "demo", password: "demo-password") {
    token
    message
  }
}
```

Copy the `token` value and include it as a bearer token in the
`Authorization` header for all GraphQL requests:

```
Authorization: Bearer <token>
```

### 2. Chat with the bot (mutation)

```graphql
mutation Chat {
  chat(message: "Hello") {
    reply
  }
}
```

### 3. Stream replies (subscription)

```graphql
subscription StreamChat {
  chatStream(message: "Tell me a joke")
}
```

Each string chunk arrives separately; concatenate them to render the full
response. The backend stores the completed assistant reply in the token’s
conversation history once streaming finishes.

### 4. Reset the session

```graphql
mutation Reset {
  resetSession {
    message
  }
}
```

## Frontend usage

1. Open `http://localhost:8000/frontend/login.html` and sign in (demo
   credentials are prefilled).
2. After login, you are redirected to `chat.html` where you can either:
   - Click **Send** to run the GraphQL `chat` mutation.
   - Click **Stream** to start the `chatStream` subscription for live token
     updates.
3. Use **Reset Session** to clear conversation history for the current token
   or **Logout** to return to the login page.

## Notes

- Replace the in-memory `USER_DB` in `backend/main.py` with a real
  authentication provider for production use.
- The root path `/` returns a health message; all chatbot interactions are
  handled via `/graphql` and subscriptions use WebSockets on the same path.
