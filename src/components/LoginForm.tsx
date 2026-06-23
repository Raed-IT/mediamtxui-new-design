"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/ApiClient";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@test.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      window.location.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <main className="login-page">
      <div className="card login-card">
        <div className="login-logo">MTX</div>
        <div className="eyebrow">Secure access</div>
        <h1>MediaMTX Dashboard</h1>
        <p className="muted">
          Sign in to manage drones, cities, users, and the live NVR grid.
        </p>

        <form onSubmit={login} className="grid" style={{ marginTop: 22 }}>
          <div className="form-field">
            <label>Email</label>
            <input
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <span className="badge danger">{error}</span>}
          <button className="btn">Login</button>
        </form>

        <div className="card" style={{ marginTop: 18, boxShadow: "none" }}>
          <strong>Seed accounts</strong>
          <p className="muted">superadmin@test.com / 123456</p>
          <p className="muted">admin.damascus@test.com / 123456</p>
          <p className="muted">viewer.damascus@test.com / 123456</p>
        </div>
      </div>
    </main>
  );
}
