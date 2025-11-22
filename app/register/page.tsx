"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestGraphQL } from "@/lib/graphql-client";

const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      id
      email
    }
  }
`;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await requestGraphQL<{ register: { id: string; email: string } }>(REGISTER_MUTATION, {
        email,
        password,
      });
      setSuccess(`Registered ${data.register.email}. You can now login.`);
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Create an account</h1>
        <p className="text-sm text-muted-foreground">Register through the mocked GraphQL mutation.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Set an email and password to create a demo user.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already registered?{' '}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Go to login
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
