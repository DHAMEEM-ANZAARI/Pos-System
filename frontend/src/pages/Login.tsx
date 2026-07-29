import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@pos.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-tape text-2xl font-bold tracking-tight">
            COUNTER<span className="text-accent">·</span>POS
          </div>
          <p className="text-sm text-muted mt-1">DA retail terminal</p>
        </div>

        <div className="relative border border-line rounded-sm shadow-sm bg-white/40">
          <div className="tape-edge-top" />
          <form onSubmit={handleSubmit} className="px-6 py-6 font-tape text-sm">
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-line bg-paper px-3 py-2 rounded-sm focus:border-accent outline-none"
              />
            </div>
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-line bg-paper px-3 py-2 rounded-sm focus:border-accent outline-none"
              />
            </div>

            {error && (
              <div className="mb-4 text-rust text-xs border border-rust/30 bg-rust/5 px-3 py-2 rounded-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent text-paper py-2.5 rounded-sm font-sans font-medium hover:bg-accentDark transition-colors disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="tape-edge" />
        </div>

        <div className="mt-6 text-xs text-muted text-center leading-relaxed">
          Demo accounts (password: password123)
          <br />
          admin@pos.test · manager@pos.test · cashier@pos.test
        </div>
      </div>
    </div>
  );
}
