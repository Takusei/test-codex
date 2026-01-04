"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/room");
  };

  return (
    <main className="page">
      <section className="card login-card">
        <div>
          <p className="eyebrow">Virtual Data Room</p>
          <h1>Sign in</h1>
          <p className="muted">
            Access your secured documents by signing in to the portal.
          </p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="primary" type="submit">
            Continue
          </button>
        </form>
        <p className="helper">
          Demo mode — any credentials will take you to the room selector.
        </p>
      </section>
    </main>
  );
}
