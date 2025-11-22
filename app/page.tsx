"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar, HistoryEntry } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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

type State = {
  auth: Auth | null;
  history: HistoryEntry[];
  loadingHistory: boolean;
  historyError: string | null;
};

const INITIAL_STATE: State = {
  auth: null,
  history: [],
  loadingHistory: false,
  historyError: null,
};

export default function HomePage() {
  const router = useRouter();
  const [state, setState] = useState<State>(INITIAL_STATE);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("auth") : null;
    if (!stored) {
      router.replace("/login");
      return;
    }

    const parsed = JSON.parse(stored) as Auth;
    setState((current) => ({ ...current, auth: parsed }));

    const fetchHistory = async () => {
      setState((current) => ({ ...current, loadingHistory: true, historyError: null }));
      try {
        const data = await requestGraphQL<{ history: HistoryEntry[] }>(HISTORY_QUERY, undefined, {
          token: parsed.token,
        });
        setState((current) => ({ ...current, history: data.history }));
      } catch (err) {
        setState((current) => ({ ...current, historyError: (err as Error).message }));
      } finally {
        setState((current) => ({ ...current, loadingHistory: false }));
      }
    };

    fetchHistory();
  }, [router]);

  const token = state.auth?.token;

  useEffect(() => {
    if (!token) return;

    const validateSession = async () => {
      try {
        const data = await requestGraphQL<{ me: Auth["user"] }>(ME_QUERY, undefined, { token });
        setState((current) => ({ ...current, auth: current.auth ? { ...current.auth, user: data.me } : current.auth }));
      } catch (err) {
        console.error("Session validation failed", err);
        router.replace("/login");
      }
    };

    validateSession();
  }, [token, router]);

  const handleSwitchUser = () => {
    localStorage.removeItem("auth");
    router.replace("/login");
  };

  const username = state.auth?.user.username;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40">
        <AppSidebar
          history={state.history}
          loading={state.loadingHistory}
          error={state.historyError}
          onSwitchUser={handleSwitchUser}
        />

        <SidebarInset>
          <header className="flex h-16 items-center gap-3 border-b bg-background/80 px-6">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between pl-1">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Signed in</span>
                <span className="text-sm font-medium">{username ?? ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/register">Create account</Link>
                </Button>
                <Button variant="outline" onClick={handleSwitchUser}>
                  Log out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-6 p-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Welcome{username ? `, ${username}` : ""}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  The left sidebar mirrors the shadcn sidebar pattern so your history is anchored to the left, similar to a
                  desktop chat layout.
                </p>
                <p className="mt-3">
                  Add your conversation or document view here. The right side stays flexible for desktop, without mobile
                  adjustments.
                </p>
              </CardContent>
            </Card>
            <div className="flex-1 rounded-lg border border-dashed bg-background/60" />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
