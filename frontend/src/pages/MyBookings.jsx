
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function formatStatus(value) {
  return String(value || "pending")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [payingId, setPayingId] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [bookingResponse, profileResponse] = await Promise.all([
        api.get("/bookings/my"),
        api.get("/auth/me"),
      ]);
      setBookings(bookingResponse.data.bookings || []);
      setProfile(profileResponse.data.user || null);
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load your bookings."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const isPastBooking = (booking) => {
    const status = String(booking.bookingStatus || "").toLowerCase();
    return (
      ["cancelled", "completed", "expired"].includes(status) ||
      (booking.endTime && new Date(booking.endTime).getTime() <= Date.now())
    );
  };

  const visibleBookings = bookings.filter((booking) => {
    if (bookingFilter === "past") return isPastBooking(booking);
    if (bookingFilter === "upcoming") return !isPastBooking(booking);
    return true;
  });

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    loadBookings();
  }, [navigate, loadBookings]);

  function handlePayNow(booking) {
    navigate("/payment", {
      state: {
        bookingId: booking._id,
      },
    });
  }

  async function cancelBooking(booking) {
    const isPaid = String(booking.paymentStatus || "").toLowerCase() === "paid";
    const confirmed = window.confirm(
      isPaid
        ? "Cancel this paid booking? The locker will be released, but the payment will not be refunded automatically. Contact support to arrange a refund."
        : "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setCancellingId(booking._id);
    setError("");

    try {
      await api.patch(`/bookings/${booking._id}/cancel`);
      await loadBookings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to cancel this booking."
      );
    } finally {
      setCancellingId("");
    }
  }

  if (loading) {
    return (
      <section className="booking-page">
        <div className="booking-container">
          <div className="booking-panel">
            <p>Loading your bookings...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-page">
      <div className="booking-container">
        <div className="booking-heading">
          <span className="booking-kicker">YOUR ACCOUNT</span>
          <h1>My bookings</h1>
          <p>
            Review your reservations, payment status and booking details.
          </p>
        </div>

        {profile && (
          <section className="account-profile" aria-labelledby="account-profile-title">
            <div>
              <span className="booking-kicker">SIGNED-IN ACCOUNT</span>
              <h2 id="account-profile-title">{profile.name}</h2>
              <p>{profile.email}</p>
            </div>
            <dl>
              <div><dt>Phone</dt><dd>{profile.phone || "Not provided"}</dd></div>
              <div><dt>Account type</dt><dd>{formatStatus(profile.role)}</dd></div>
            </dl>
          </section>
        )}

        {error && (
          <div className="booking-alert" role="alert">
            {error}
          </div>
        )}

        <div className="my-bookings-toolbar">
          <span>
            {visibleBookings.length} of {bookings.length} bookings
          </span>

          <button
            type="button"
            className="booking-refresh-button"
            onClick={loadBookings}
            disabled={loading}
          >
            Refresh bookings
          </button>
        </div>

        <div className="booking-history-tabs" role="group" aria-label="Filter booking history">
          {[
            ["all", "All bookings"],
            ["upcoming", "Current & upcoming"],
            ["past", "Past bookings"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={bookingFilter === value ? "active" : ""}
              aria-pressed={bookingFilter === value}
              onClick={() => setBookingFilter(value)}
            >
              {label}
              {value === "past" ? ` (${bookings.filter(isPastBooking).length})` : ""}
            </button>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div className="booking-panel booking-empty">
            <div className="booking-success-icon">📦</div>
            <h2>No bookings yet</h2>
            <p>
              Your reservations will appear here after you book a locker.
            </p>

            <Link
              to="/locations"
              className="booking-primary-button"
            >
              Find storage
            </Link>
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="booking-panel booking-empty">
            <h2>No {bookingFilter === "past" ? "past" : "current or upcoming"} bookings</h2>
            <p>Choose another booking filter to see your reservations.</p>
          </div>
        ) : (
          <div className="my-bookings-list">
            {visibleBookings.map((booking) => {
              const locker =
                booking.locker &&
                typeof booking.locker === "object"
                  ? booking.locker
                  : null;

              const status = String(
                booking.bookingStatus || "pending"
              ).toLowerCase();

              const paymentStatus = String(
                booking.paymentStatus || "pending"
              ).toLowerCase();

              const canPay =
                status === "pending" &&
                paymentStatus === "pending";

              const canCancel = ["pending", "confirmed"].includes(status) &&
                (!booking.endTime || new Date(booking.endTime).getTime() > Date.now());

              return (
                <article
                  className="my-booking-card"
                  key={booking._id}
                >
                  <div className="my-booking-top">
                    <div>
                      <span className="booking-kicker">
                        BOOKING REFERENCE
                      </span>

                      <h2>
                        {booking.bookingReference || booking._id}
                      </h2>
                    </div>

                    <span
                      className={`booking-status status-${status}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>

                  <div className="my-booking-details">
                    <div>
                      <span>Locker</span>
                      <strong>
                        {locker?.name ||
                          locker?.lockerNumber ||
                          locker?.number ||
                          "Locker details unavailable"}
                      </strong>
                    </div>

                    <div>
                      <span>Location</span>
                      <strong>
                        {locker?.location?.name || "Location details unavailable"}
                        {locker?.location?.city ? `, ${locker.location.city}` : ""}
                      </strong>
                    </div>

                    <div>
                      <span>Start</span>
                      <strong>
                        {formatDate(booking.startTime)}
                      </strong>
                    </div>

                    <div>
                      <span>End</span>
                      <strong>
                        {formatDate(booking.endTime)}
                      </strong>
                    </div>

                    <div>
                      <span>Payment status</span>
                      <strong
                        className={`payment-status payment-${paymentStatus}`}
                      >
                        {formatStatus(paymentStatus)}
                      </strong>
                    </div>

                    <div>
                      <span>Duration</span>
                      <strong>
                        {booking.totalHours ?? "—"} hours
                      </strong>
                    </div>

                    <div>
                      <span>Total amount</span>
                      <strong>
                        ₹
                        {Number(
                          booking.totalAmount || 0
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>

                  <div className="my-booking-actions">
                    {canPay && (
                      <button
                        type="button"
                        className="booking-primary-button"
                        disabled={payingId === booking._id}
                        onClick={() => {
                          setPayingId(booking._id);
                          handlePayNow(booking);
                        }}
                      >
                        {payingId === booking._id
                          ? "Opening payment..."
                          : "Pay Now →"}
                      </button>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        className="booking-cancel-button"
                        disabled={cancellingId === booking._id}
                        onClick={() => cancelBooking(booking)}
                      >
                        {cancellingId === booking._id
                          ? "Cancelling..."
                          : "Cancel booking"}
                      </button>
                    )}
                  </div>

                  {paymentStatus === "paid" && status !== "cancelled" && (
                    <p className="booking-hint">
                      Paid booking cancellation releases the locker, but does
                      not automatically refund the payment. Contact support to
                      arrange a refund: <a href="mailto:support@urbanlocker.com">support@urbanlocker.com</a>.
                    </p>
                  )}

                  {paymentStatus === "paid" && status === "cancelled" && (
                    <p className="booking-hint">
                      Booking cancelled. Refund is not automatic; contact
                      support to arrange it: <a href="mailto:support@urbanlocker.com">support@urbanlocker.com</a>.
                    </p>
                  )}

                  {canPay && (
                    <p className="booking-hint">
                      Complete payment to confirm this reservation.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="my-bookings-footer">
          <Link to="/locations">← Browse locations</Link>
        </div>
      </div>
    </section>
  );
}
