
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

function getLocalDateTime(offsetHours = 1) {
  const date = new Date(
    Date.now() + offsetHours * 60 * 60 * 1000
  );

  date.setMinutes(
    date.getMinutes() - date.getTimezoneOffset()
  );

  return date.toISOString().slice(0, 16);
}

export default function BookingForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialLocker = searchParams.get("locker") || "";

  const [lockers, setLockers] = useState([]);
  const [lockerId, setLockerId] = useState(initialLocker);
  const [startTime, setStartTime] = useState(
    getLocalDateTime(1)
  );
  const [endTime, setEndTime] = useState(
    getLocalDateTime(3)
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  // Load available lockers
  useEffect(() => {
    let active = true;

    async function loadLockers() {
      try {
        const response = await api.get("/lockers");
        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : data.lockers || data.data || [];

        if (active) {
          setLockers(
            list.filter(
              (locker) =>
                locker.isActive !== false &&
                String(locker.status || "").toLowerCase() ===
                  "available"
            )
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load lockers. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLockers();

    return () => {
      active = false;
    };
  }, []);

  const selectedLocker = lockers.find(
    (locker) =>
      String(locker._id || locker.id) === lockerId
  );

  // Estimated price for the UI; server calculates the final amount.
  const estimatedHours =
    startTime && endTime
      ? Math.max(
          0,
          Math.ceil(
            (new Date(endTime).getTime() -
              new Date(startTime).getTime()) /
              3600000
          )
        )
      : 0;

  const pricePerHour = Number(
    selectedLocker?.pricePerHour
  );

  const pricePerDay = Number(selectedLocker?.pricePerDay);
  const estimatedDays = Math.floor(estimatedHours / 24);
  const estimatedRemainderHours = estimatedHours % 24;

  const estimatedAmount =
    Number.isFinite(pricePerHour) && pricePerHour >= 0 &&
    Number.isFinite(pricePerDay) && pricePerDay >= 0
      ? estimatedDays * pricePerDay + estimatedRemainderHours * pricePerHour
      : null;

  // Create booking
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setBooking(null);

    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    if (!lockerId) {
      setError("Please select a locker.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      !startTime ||
      !endTime ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start <= new Date() ||
      end <= start
    ) {
      setError(
        "Choose a future start time and an end time after the start."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/bookings", {
        locker: lockerId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

      const createdBooking = response.data.booking;

      if (!createdBooking?._id) {
        throw new Error(
          "The server did not return a booking ID."
        );
      }

      setBooking(createdBooking);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Booking could not be created."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Loading screen
  if (loading) {
    return (
      <section className="booking-page">
        <div className="booking-panel">
          <p>Loading available lockers...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-page">
      <div className="booking-container">
        <Link to="/locations" className="booking-back">
          ← Back to locations
        </Link>

        <div className="booking-heading">
          <span className="booking-kicker">
            URBANLOCKER RESERVATIONS
          </span>

          <h1>Book your storage</h1>

          <p>
            Select an available locker and choose your storage time.
          </p>
        </div>

        {error && (
          <div className="booking-alert" role="alert">
            {error}
          </div>
        )}

        {/* Booking success screen */}
        {booking ? (
          <div className="booking-success">
            <div className="booking-success-icon">✓</div>

            <h2>Booking created!</h2>

            <p>
              Your reservation is pending payment confirmation.
              It is not yet a paid booking.
            </p>

            <div className="booking-reference">
              <span>Booking reference</span>

              <strong>
                {booking.bookingReference || booking._id}
              </strong>
            </div>

            <div className="booking-total">
              <span>Total amount</span>

              <strong>
                ₹
                {Number(
                  booking.totalAmount || 0
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <button
              type="button"
              className="booking-primary-button"
              onClick={() =>
                navigate("/payment", {
                  state: {
                    bookingId: booking._id,
                  },
                })
              }
            >
              Proceed to Payment →
            </button>

            <Link
              to="/my-bookings"
              className="booking-secondary-button"
            >
              View my bookings
            </Link>
          </div>
        ) : (
          /* Booking form */
          <form
            className="booking-panel"
            onSubmit={handleSubmit}
          >
            <div className="booking-field">
              <label htmlFor="booking-locker">
                Select locker
              </label>

              <select
                id="booking-locker"
                value={lockerId}
                onChange={(event) =>
                  setLockerId(event.target.value)
                }
                required
              >
                <option value="">
                  Choose a locker
                </option>

                {lockers.map((locker) => (
                  <option
                    key={locker._id || locker.id}
                    value={locker._id || locker.id}
                  >
                    {locker.name ||
                      locker.lockerNumber ||
                      locker.number ||
                      "Locker"}

                    {locker.pricePerHour != null
                      ? ` — ₹${locker.pricePerHour}/hour`
                      : ""}
                  </option>
                ))}
              </select>

              {lockers.length === 0 && (
                <p className="booking-hint">
                  No lockers are currently listed as available.
                </p>
              )}
            </div>

            <div className="booking-fields-grid">
              <div className="booking-field">
                <label htmlFor="booking-start">
                  Start date &amp; time
                </label>

                <input
                  id="booking-start"
                  type="datetime-local"
                  min={getLocalDateTime(0)}
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(event.target.value)
                  }
                  required
                />
              </div>

              <div className="booking-field">
                <label htmlFor="booking-end">
                  End date &amp; time
                </label>

                <input
                  id="booking-end"
                  type="datetime-local"
                  min={startTime || getLocalDateTime(0)}
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* Booking summary */}
            <div className="booking-summary">
              <h2>Booking summary</h2>

              <div>
                <span>Estimated duration</span>

                <strong>
                  {estimatedHours > 0
                    ? `${estimatedHours} hours`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Hourly rate</span>

                <strong>
                  {selectedLocker?.pricePerHour != null
                    ? `₹${selectedLocker.pricePerHour}`
                    : "As per server pricing"}
                </strong>
              </div>

              <div>
                <span>Daily rate</span>

                <strong>
                  {selectedLocker?.pricePerDay != null
                    ? `₹${selectedLocker.pricePerDay}`
                    : "As per server pricing"}
                </strong>
              </div>

              <div className="booking-summary-total">
                <span>Estimated total</span>

                <strong>
                  {estimatedAmount !== null &&
                  estimatedHours > 0
                    ? `₹${estimatedAmount.toLocaleString(
                        "en-IN"
                      )}`
                    : "Calculated by server"}
                </strong>
              </div>

              <p>
                The backend calculates the final amount.
                Payment is handled separately.
              </p>
            </div>

            <button
              type="submit"
              className="booking-primary-button"
              disabled={
                submitting || lockers.length === 0
              }
            >
              {submitting
                ? "Creating booking..."
                : "Create booking"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
