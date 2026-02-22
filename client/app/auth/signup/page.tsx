"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login, register } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await register({ name, email, password });
      await login({ email, password });
      router.push("/dashboard");
    } catch {
      setError("Signup failed. Try a different email.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="panel w-full p-8">
        <h1 className="text-3xl font-semibold">Sign Up</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Build your interview prep workspace.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            required
            type="text"
            minLength={2}
            placeholder="Full name"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Password"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            disabled={pending}
            className="btn-primary w-full rounded-xl px-4 py-3 disabled:opacity-60"
            type="submit"
          >
            {pending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link className="text-[var(--brand)]" href="/auth/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
