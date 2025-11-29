import { NextResponse } from "next/server";

type User = {
  id: string;
  email: string;
  password: string;
};

type HistoryItem = {
  id: string;
  label: string;
  timestamp: string;
};

const db: { users: User[]; history: Record<string, HistoryItem[]> } = {
  users: [
    { id: "1", email: "demo@example.com", password: "password" },
    { id: "2", email: "captain@example.com", password: "secret" },
  ],
  history: {
    "1": [
      { id: "h1", label: "Initial import", timestamp: "2024-11-05T10:00:00Z" },
      { id: "h2", label: "Updated profile", timestamp: "2024-11-06T15:30:00Z" },
    ],
    "2": [
      { id: "h3", label: "Created workspace", timestamp: "2024-07-22T12:05:00Z" },
    ],
  },
};

function extractOperation(query: string) {
  const normalized = query.toLowerCase();
  if (normalized.includes("mutation") && normalized.includes("register")) return "register";
  if (normalized.includes("login")) return "login";
  if (normalized.includes("history")) return "history";
  return "unknown";
}

export async function POST(request: Request) {
  const { query, variables } = (await request.json()) as { query: string; variables?: Record<string, string> };
  const operation = extractOperation(query);

  if (operation === "login") {
    const { email, password } = variables ?? {};
    const user = db.users.find((entry) => entry.email === email && entry.password === password);

    if (!user) {
      return NextResponse.json({ errors: [{ message: "Invalid credentials" }] }, { status: 401 });
    }

    return NextResponse.json({ data: { login: { id: user.id, email: user.email } } });
  }

  if (operation === "register") {
    const { email, password } = variables ?? {};
    if (!email || !password) {
      return NextResponse.json({ errors: [{ message: "Email and password are required" }] }, { status: 400 });
    }

    if (db.users.some((entry) => entry.email === email)) {
      return NextResponse.json({ errors: [{ message: "Email is already registered" }] }, { status: 409 });
    }

    const id = String(db.users.length + 1);
    const newUser: User = { id, email, password };
    db.users.push(newUser);
    db.history[id] = [];

    return NextResponse.json({ data: { register: { id, email } } }, { status: 201 });
  }

  if (operation === "history") {
    const userId = variables?.userId ?? "1";
    const history = db.history[userId] ?? [];
    return NextResponse.json({ data: { history } });
  }

  return NextResponse.json({ errors: [{ message: "Unknown operation" }] }, { status: 400 });
}
