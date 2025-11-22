"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestGraphQL } from "@/lib/graphql-client";

const LOGIN_QUERY = `
  query Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      email
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await requestGraphQL<{ login: { id: string; email: string } }>(LOGIN_QUERY, {
        email,
        password,
      });
      localStorage.setItem("user", JSON.stringify(data.login));
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-8">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Sign in to access the home view powered by the mocked GraphQL endpoint.
            </p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Enter your email below to sign in to your account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(109,40,217,0.22),transparent_30%),linear-gradient(to_bottom_right,rgba(14,165,233,0.08),rgba(99,102,241,0.12))]" />
        <div className="relative flex h-full flex-col items-center justify-center gap-6 p-10 text-center">
          <div className="inline-flex items-center rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm ring-1 ring-primary/20 backdrop-blur">
            GraphQL Demo
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Next.js + Shadcn Login</h2>
            <p className="max-w-[360px] text-balance text-sm text-muted-foreground">
              This login experience mirrors the <span className="font-semibold">login-01</span> pattern from the
              Shadcn collection, wired up to the mocked GraphQL authentication endpoint for this demo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
