import { useState } from "react";

/**
 * Wachtwoord-login voor het dashboard.
 *
 * Vervangt de externe Manus OAuth-portal: het wachtwoord staat in de
 * DASHBOARD_PASSWORD environment variable van de Railway-service en de
 * sessie is een lokaal ondertekende JWT-cookie (een jaar geldig).
 */
export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Inloggen mislukt. Probeer het opnieuw.");
    } catch {
      setError("Kon de server niet bereiken. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-foreground mb-1">Matti Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">Alleen voor beheerders</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1" htmlFor="password">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={!password || busy}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {busy ? "Bezig..." : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
