
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Login response did not contain a token or user.");
      }

      const role = String(user.role || "").toLowerCase();

      if (role !== "admin" && role !== "customer") {
        throw new Error("Your account has an invalid role.");
      }

      // Save authenticated session
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("urbanlocker:auth-change"));

      // Always return users to the public home page after a successful login.
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="booking-kicker">WELCOME BACK</span>

        <h1>Log in</h1>

        <p>Sign in to manage your UrbanLocker reservations.</p>

        {error && (
          <div className="booking-alert" role="alert">
            {error}
          </div>
        )}

        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
        />

        <button
          type="submit"
          className="booking-primary-button"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Log in"}
        </button>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Create account</Link>
        </p>
      </form>
    </section>
  );
}
