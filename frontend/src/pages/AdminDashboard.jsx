
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [lockers, setLockers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("locations");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [cancellingBookingId, setCancellingBookingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lockerForm, setLockerForm] = useState({ location: "", lockerNumber: "", size: "medium", pricePerHour: "", pricePerDay: "", description: "" });
  const [lockerSaving, setLockerSaving] = useState(false);
  const [editingLockerId, setEditingLockerId] = useState("");

  const emptyForm = {
    name: "",
    type: "railway",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    description: "",
    latitude: "",
    longitude: "",
  };

  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");

    let user;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      user = null;
    }

    if (
      !token ||
      String(user?.role || "").toLowerCase() !== "admin"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [locationResponse, lockerResponse, bookingResponse, profileResponse] = await Promise.all([
        api.get("/locations"),
        api.get("/lockers?status=all"),
        api.get("/bookings/admin/all"),
        api.get("/auth/me"),
      ]);

      const locationData = locationResponse.data;
      const lockerData = lockerResponse.data;

      setLocations(
        Array.isArray(locationData)
          ? locationData
          : locationData?.locations ||
              locationData?.data ||
              []
      );

      setLockers(
        Array.isArray(lockerData)
          ? lockerData
          : lockerData?.lockers ||
              lockerData?.data ||
              []
      );

      setBookings(
        Array.isArray(bookingResponse.data?.bookings)
          ? bookingResponse.data.bookings
          : []
      );
      setProfile(profileResponse.data.user || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Data load nahi hua. Backend aur API permissions check karo."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isPastBooking = (booking) => {
    const status = String(booking.bookingStatus || "").toLowerCase();
    return (
      ["cancelled", "completed", "expired"].includes(status) ||
      (booking.endTime && new Date(booking.endTime).getTime() <= Date.now())
    );
  };

  const visibleBookings = bookings.filter((booking) => {
    if (bookingFilter === "past") return isPastBooking(booking);
    if (bookingFilter === "active") return !isPastBooking(booking);
    return true;
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setEditingId("");
    setForm({ ...emptyForm });
  }

  function handleEdit(location) {
    const coordinates = location.location?.coordinates || [];

    setEditingId(location._id);

    setForm({
      name: location.name || "",
      type: location.type || "railway",
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      country: location.country || "India",
      pincode: location.pincode || "",
      description: location.description || "",
      longitude: coordinates[0] ?? "",
      latitude: coordinates[1] ?? "",
    });

    setActiveTab("locations");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const latitudeProvided = form.latitude !== "";
    const longitudeProvided = form.longitude !== "";

    if (latitudeProvided !== longitudeProvided) {
      setError("Latitude aur longitude dono fill karo, ya dono blank chhodo.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim() || "India",
      pincode: form.pincode.trim(),
      description: form.description.trim(),
    };

    if (latitudeProvided && longitudeProvided) {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        setError("Valid latitude aur longitude enter karo.");
        return;
      }

      payload.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/locations/${editingId}`, payload);
        setMessage("Location successfully updated.");
      } else {
        await api.post("/locations", payload);
        setMessage("Location successfully created.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Location save nahi hui. Backend validation check karo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(location) {
    const confirmed = window.confirm(
      `Kya tum "${location.name}" delete karna chahte ho?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/locations/${location._id}`);

      if (editingId === location._id) {
        resetForm();
      }

      setMessage("Location deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Location delete nahi hui."
      );
    }
  }

  async function cancelAdminBooking(booking) {
    const confirmed = window.confirm(
      String(booking.paymentStatus || "").toLowerCase() === "paid"
        ? `Cancel paid booking ${booking.bookingReference || booking._id}? This releases the locker but does not refund payment automatically.`
        : `Cancel booking ${booking.bookingReference || booking._id}?`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    setCancellingBookingId(booking._id);
    try {
      const response = await api.patch(`/bookings/admin/${booking._id}/cancel`);
      setMessage(response.data?.message || "Booking cancelled and locker released successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Booking could not be cancelled.");
    } finally {
      setCancellingBookingId("");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  async function saveLocker(event) {
    event.preventDefault();
    setError(""); setMessage(""); setLockerSaving(true);
    try {
      const payload = { ...lockerForm, pricePerHour: Number(lockerForm.pricePerHour), pricePerDay: Number(lockerForm.pricePerDay) };
      if (editingLockerId) await api.put(`/lockers/${editingLockerId}`, payload);
      else await api.post("/lockers", payload);
      setMessage(editingLockerId ? "Locker updated successfully." : "Locker created successfully.");
      setEditingLockerId("");
      setLockerForm({ location: "", lockerNumber: "", size: "medium", pricePerHour: "", pricePerDay: "", description: "" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Locker could not be saved.");
    } finally { setLockerSaving(false); }
  }

  function editLocker(locker) {
    setLockerForm({ location: locker.location?._id || locker.location || "", lockerNumber: locker.lockerNumber || "", size: locker.size || "medium", pricePerHour: locker.pricePerHour ?? "", pricePerDay: locker.pricePerDay ?? "", description: locker.description || "" });
    setEditingLockerId(locker._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="admin-loading">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <Link to="/" className="admin-brand">
            UrbanLocker
          </Link>
          <p>Administration Panel</p>
        </div>

        <div className="admin-header-actions">
          <Link to="/">View Website</Link>
          <Link to="/profile">Profile</Link>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="admin-content">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">
          Manage locations and view lockers.
        </p>

        {profile && (
          <section className="admin-profile-card" aria-labelledby="admin-profile-title">
            <div>
              <span>Signed-in administrator</span>
              <h2 id="admin-profile-title">{profile.name}</h2>
              <p>{profile.email}</p>
            </div>
            <dl>
              <div><dt>Phone</dt><dd>{profile.phone || "Not provided"}</dd></div>
              <div><dt>Role</dt><dd>{profile.role || "admin"}</dd></div>
            </dl>
          </section>
        )}

        {error && (
          <div className="admin-alert error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="admin-alert success" role="status">
            {message}
          </div>
        )}

        <div className="admin-stats">
          <article className="admin-stat">
            <span>Total Locations</span>
            <strong>{locations.length}</strong>
          </article>

          <article className="admin-stat">
            <span>Total Lockers</span>
            <strong>{lockers.length}</strong>
          </article>
        </div>

        <div className="admin-tabs">
          <button
            type="button"
            className={activeTab === "locations" ? "active" : ""}
            onClick={() => setActiveTab("locations")}
          >
            Manage Locations
          </button>

          <button
            type="button"
            className={activeTab === "lockers" ? "active" : ""}
            onClick={() => setActiveTab("lockers")}
          >
            Manage Lockers
          </button>

          <button
            type="button"
            className={activeTab === "bookings" ? "active" : ""}
            onClick={() => setActiveTab("bookings")}
          >
            Manage Bookings
          </button>
        </div>

        {activeTab === "locations" && (
          <>
            <form className="admin-form" onSubmit={handleSubmit}>
              <h2>
                {editingId ? "Edit Location" : "Create Location"}
              </h2>

              <div className="admin-form-grid">
                <label>
                  Location Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Location Type *
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="railway">Railway Station</option>
                    <option value="airport">Airport</option>
                    <option value="tourist">Tourist Spot</option>
                  </select>
                </label>

                <label className="full-width">
                  Address *
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  City *
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  State
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Country *
                  <input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  PIN Code
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Latitude
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    min="-90"
                    max="90"
                  />
                </label>

                <label>
                  Longitude
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    min="-180"
                    max="180"
                  />
                </label>

                <label className="full-width">
                  Description
                  <textarea
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="admin-form-actions">
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Location"
                      : "Create Location"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section className="admin-list">
              <h2>All Locations</h2>

              {locations.length === 0 ? (
                <p>No locations found.</p>
              ) : (
                locations.map((location) => (
                  <article
                    className="admin-list-item"
                    key={location._id}
                  >
                    <div className="admin-item-info">
                      <strong>{location.name}</strong>
                      <p>
                        {location.address}
                        {location.city ? `, ${location.city}` : ""}
                        {location.state ? `, ${location.state}` : ""}
                      </p>
                      <small>
                        {location.type} ·{" "}
                        {location.isActive === false
                          ? "Inactive"
                          : "Active"}
                        {` · ${location.totalLockers || 0} total · ${location.availableLockers || 0} available`}
                      </small>
                    </div>

                    <div className="admin-item-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(location)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(location)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}

        {activeTab === "lockers" && (
          <>
          <form className="admin-form" onSubmit={saveLocker}>
            <h2>{editingLockerId ? "Update Locker" : "Create Locker"}</h2>
            <div className="admin-form-grid">
              <label>Location *<select required value={lockerForm.location} onChange={e => setLockerForm({...lockerForm, location:e.target.value})}><option value="">Choose location</option>{locations.map(location => <option key={location._id} value={location._id}>{location.name} — {location.city}</option>)}</select></label>
              <label>Locker ID *<input required value={lockerForm.lockerNumber} onChange={e => setLockerForm({...lockerForm, lockerNumber:e.target.value})} /></label>
              <label>Size *<select value={lockerForm.size} onChange={e => setLockerForm({...lockerForm, size:e.target.value})}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
              <label>Price per hour (₹) *<input type="number" min="0" step="0.01" required value={lockerForm.pricePerHour} onChange={e => setLockerForm({...lockerForm, pricePerHour:e.target.value})} /></label>
              <label>Price per day (₹) *<input type="number" min="0" step="0.01" required value={lockerForm.pricePerDay} onChange={e => setLockerForm({...lockerForm, pricePerDay:e.target.value})} /></label>
              <label className="full-width">Description<input value={lockerForm.description} onChange={e => setLockerForm({...lockerForm, description:e.target.value})} /></label>
            </div>
            <div className="admin-form-actions"><button type="submit" disabled={lockerSaving || !locations.length}>{lockerSaving ? "Saving..." : editingLockerId ? "Update Locker" : "Create Locker"}</button>{editingLockerId && <button type="button" className="secondary" onClick={() => {setEditingLockerId("");setLockerForm({ location:"", lockerNumber:"", size:"medium", pricePerHour:"", pricePerDay:"", description:"" });}}>Cancel</button>}</div>
          </form>
          <section className="admin-list">
            <h2>All Lockers</h2>

            {lockers.length === 0 ? (
              <p>No lockers found.</p>
            ) : (
              lockers.map((locker) => (
                <article
                  className="admin-list-item"
                  key={locker._id}
                >
                  <div className="admin-item-info">
                    <strong>
                      {locker.name ||
                        locker.lockerNumber ||
                        `Locker ${String(locker._id).slice(-6)}`}
                    </strong>

                    <p>
                      Location:{" "}
                      {typeof locker.location === "object"
                        ? locker.location?.name ||
                          locker.location?._id ||
                          "Not specified"
                        : locker.location || "Not specified"}
                    </p>

                    <small>
                      Status: {locker.status || "Unknown"} · ₹{locker.pricePerHour}/hour · ₹{locker.pricePerDay}/day
                    </small>
                  </div>
                  <div className="admin-item-actions"><button type="button" onClick={() => editLocker(locker)}>Edit</button></div>
                </article>
              ))
            )}
          </section>
          </>
        )}

        {activeTab === "bookings" && (
          <section className="admin-list">
            <h2>All Bookings</h2>
            <div className="admin-booking-filters" role="group" aria-label="Filter bookings">
              {[
                ["all", "All bookings"],
                ["active", "Current & upcoming"],
                ["past", "Past bookings"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={bookingFilter === value ? "active" : ""}
                  aria-pressed={bookingFilter === value}
                  onClick={() => setBookingFilter(value)}
                >
                  {label}{value === "past" ? ` (${bookings.filter(isPastBooking).length})` : ""}
                </button>
              ))}
            </div>
            {bookings.length === 0 ? (
              <p>No bookings found.</p>
            ) : visibleBookings.length === 0 ? (
              <p>No bookings in this section.</p>
            ) : (
              visibleBookings.map((booking) => {
                const customer = booking.user || {};
                const locker = booking.locker || {};
                const location = locker.location || {};
                const status = String(booking.bookingStatus || "pending").toLowerCase();
                const paymentStatus = String(booking.paymentStatus || "pending").toLowerCase();
                const canCancel = ["pending", "confirmed"].includes(status) &&
                  (!booking.endTime || new Date(booking.endTime).getTime() > Date.now());

                return (
                  <article className="admin-list-item" key={booking._id}>
                    <div className="admin-item-info">
                      <strong>{booking.bookingReference || booking._id}</strong>
                      <p>
                        Customer: {customer.name || "Unknown"}
                        {customer.email ? ` · ${customer.email}` : ""}
                      </p>
                      <p>
                        Locker: {locker.lockerNumber || locker.name || "—"}
                        {location.name ? ` · ${location.name}` : ""}
                      </p>
                      <small>
                        {booking.startTime ? new Date(booking.startTime).toLocaleString() : "—"}
                        {" → "}
                        {booking.endTime ? new Date(booking.endTime).toLocaleString() : "—"}
                        {` · ₹${Number(booking.totalAmount || 0).toLocaleString("en-IN")}`}
                        {` · ${status} · payment ${paymentStatus}`}
                      </small>
                    </div>
                    <div className="admin-item-actions">
                      {canCancel ? (
                        <button
                          type="button"
                          className="danger"
                          disabled={cancellingBookingId === booking._id}
                          onClick={() => cancelAdminBooking(booking)}
                        >
                          {cancellingBookingId === booking._id ? "Cancelling..." : "Cancel booking"}
                        </button>
                      ) : paymentStatus === "paid" && ["pending", "confirmed"].includes(status) ? (
                        <small>Paid cancellation requires a manual refund.</small>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}

        <button
          type="button"
          className="admin-refresh"
          onClick={loadData}
        >
          Refresh Data
        </button>
      </main>
    </section>
  );
}
