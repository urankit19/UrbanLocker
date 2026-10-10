import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true, state: { from: "/profile" } });
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await api.get("/auth/me");
        if (cancelled) return;
        const currentUser = response.data.user;
        setProfile(currentUser);
        setName(currentUser?.name || "");
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/login", { replace: true, state: { from: "/profile" } });
        } else {
          setError(err.response?.data?.message || "Unable to load Profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      setError("Enter 2 to 80 charcter name");
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch("/auth/me", { name: cleanName });
      const updatedUser = response.data.user;
      setProfile(updatedUser);
      setName(updatedUser.name || "");

      let savedUser = {};
      try {
        savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        savedUser = {};
      }
      localStorage.setItem("user", JSON.stringify({ ...savedUser, ...updatedUser }));
      window.dispatchEvent(new Event("urbanlocker:auth-change"));
      setMessage("Profile name updated Successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Profile name not updated.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="profile-page">
        <div className="profile-card"><p>Profile loading...</p></div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="profile-heading">
          <span className="booking-kicker">YOUR ACCOUNT</span>
          <h1>Profile</h1>
          <p>Check your account details and change your name.</p>
        </div>

        {error && <div className="booking-alert" role="alert">{error}</div>}
        {message && <div className="profile-success" role="status">{message}</div>}

        {profile && (
          <>
            <div className="profile-role-badge">
              {String(profile.role || "customer").toUpperCase()} ACCOUNT
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <label htmlFor="profile-name">Full name</label>
              <div className="profile-name-row">
                <input
                  id="profile-name"
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save name"}
                </button>
              </div>

              <div className="profile-details-grid">
                <div><span>Email</span><strong>{profile.email || "Not provided"}</strong></div>
                <div><span>Phone</span><strong>{profile.phone || "Not provided"}</strong></div>
                <div><span>Account type</span><strong>{profile.role || "customer"}</strong></div>
                <div><span>Member since</span><strong>{formatDate(profile.createdAt)}</strong></div>
              </div>
            </form>

            <div className="profile-links">
              {String(profile.role || "").toLowerCase() === "admin" ? (
                <Link to="/admin/dashboard">← Admin dashboard</Link>
              ) : (
                <Link to="/my-bookings">← My bookings</Link>
              )}
              <Link to="/locations">Browse locations</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
