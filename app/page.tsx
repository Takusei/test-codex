"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestGraphQL } from "@/lib/graphql-client";

const ME_QUERY = `
  query Me {
    me {
      id
      username
      email
      createdAt
    }
  }
`;

const HISTORY_QUERY = `
  query History {
    history {
      id
      label
      timestamp
    }
  }
`;

type Auth = { token: string; user: { id: string; username: string; email: string; createdAt: string } };
type HistoryItem = { id: string; label: string; timestamp: string };

export default function HomePage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("auth") : null;
    if (!stored) {
      router.replace("/login");
      return;
    }
    const parsed = JSON.parse(stored) as Auth;
    setAuth(parsed);

    const fetchHistory = async () => {
      setLoading(true);
      setHistoryError(null);
      try {
        const data = await requestGraphQL<{ history: HistoryItem[] }>(HISTORY_QUERY, undefined, {
          token: parsed.token,
        });
        setHistory(data.history);
      } catch (err) {
        setHistoryError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const token = auth?.token;

  useEffect(() => {
    if (!token) return;

    const validateSession = async () => {
      try {
        const data = await requestGraphQL<{ me: Auth["user"] }>(ME_QUERY, undefined, { token });
        setAuth((current) => (current ? { ...current, user: data.me } : current));
      } catch (err) {
        console.error("Session validation failed", err);
        router.replace("/login");
      }
    };

    validateSession();
  }, [token, router]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>History</CardTitle>
          <Button variant="outline" onClick={() => router.push("/login")}>Switch user</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading history...</p> : null}
          {historyError ? <p className="text-sm text-destructive">{historyError}</p> : null}
          {!loading && !historyError && history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : null}
          <ul className="space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="rounded-md border px-3 py-2 text-sm hover:border-primary hover:bg-accent"
              >
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="min-h-[320px]">
        <CardHeader>
          <CardTitle>Welcome{auth ? `, ${auth.user.username}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            The right side intentionally stays open so you can add content after authenticating. Use the left sidebar to
            review history pulled from the GraphQL endpoint.
          </p>
          <p className="mt-4">
            Want to try another account?{' '}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Register here
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
