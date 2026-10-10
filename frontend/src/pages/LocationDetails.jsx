
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

/* -------------------- RESPONSE HELPERS -------------------- */

function extractObject(data, keys = []) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  for (const key of keys) {
    const value = data[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }

  return data;
}

function extractArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  if (!data || typeof data !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }

  return [];
}

function getId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function getLockerLocationId(locker) {
  return getId(
    locker.location ||
      locker.locationId ||
      locker.location_id
  );
}

function getLockerStatus(locker) {
  const status = String(
    locker.status || locker.availability || ""
  ).toLowerCase();

  if (
    locker.isActive === false ||
    locker.isAvailable === false ||
    locker.available === false ||
    [
      "unavailable",
      "occupied",
      "booked",
      "maintenance",
      "inactive",
    ].includes(status)
  ) {
    return "Unavailable";
  }

  if (
    locker.isAvailable === true ||
    locker.available === true ||
    ["available", "active", "vacant"].includes(status)
  ) {
    return "Available";
  }

  return "Check availability";
}

function formatPrice(locker) {
  const value =
    locker.pricePerHour ??
    locker.hourlyRate ??
    locker.price ??
    locker.rent ??
    locker.amount;

  if (value === undefined || value === null || value === "") {
    return null;
  }

  const price = Number(value);

  if (!Number.isFinite(price)) return null;

  return `₹${price.toLocaleString("en-IN")}/hour`;
}

/* -------------------- LOCKER CARD -------------------- */

function LockerCard({ locker, onSelect }) {
  const name =
    locker.name ||
    locker.lockerNumber ||
    locker.number ||
    "Storage locker";

  const size = locker.size || locker.type || locker.category;
  const status = getLockerStatus(locker);
  const price = formatPrice(locker);
  const isAvailable = status === "Available";

  return (
    <article className="ul-locker-card">
      <div className="ul-locker-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <rect
            x="8"
            y="5"
            width="32"
            height="38"
            rx="5"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M24 6v36"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="18" cy="24" r="1.8" fill="currentColor" />
          <circle cx="30" cy="24" r="1.8" fill="currentColor" />
        </svg>
      </div>

      <div className="ul-locker-info">
        <div className="ul-locker-title-row">
          <h3>{name}</h3>

          <span
            className={
              isAvailable
                ? "ul-locker-status available"
                : "ul-locker-status"
            }
          >
            <span className="ul-status-dot" />
            {status}
          </span>
        </div>

        {size && (
          <p className="ul-locker-size">Size: {size}</p>
        )}

        {locker.description && (
          <p className="ul-locker-description">
            {locker.description}
          </p>
        )}

        <div className="ul-locker-bottom">
          <div className="ul-locker-price">
            {price ? (
              <>
                <strong>{price}</strong>
                <span>Price provided by the system</span>
              </>
            ) : (
              <span>Final price calculated during booking</span>
            )}
          </div>

          <button
            type="button"
            className="ul-select-locker-button"
            disabled={!isAvailable}
            onClick={() => onSelect(locker)}
          >
            {isAvailable ? "Select locker" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* -------------------- LOCATION DETAILS PAGE -------------------- */

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockersLoading, setLockersLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockerError, setLockerError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      setLoading(true);
      setError("");
      setLocation(null);

      try {
        const response = await api.get(
          `/locations/${encodeURIComponent(id)}`
        );

        if (!active) return;

        // Backend response format: { location: { ... } }
        const locationData = extractObject(response.data, [
          "location",
          "data",
        ]);

        if (
          !locationData ||
          !(locationData._id || locationData.id || locationData.name)
        ) {
          throw new Error("Location data was missing from the response.");
        }

        setLocation(locationData);
      } catch (err) {
        if (!active) return;

        console.error("Location loading error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load location details."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadLockers() {
      setLockersLoading(true);
      setLockerError("");

      try {
        const response = await api.get("/lockers");

        if (!active) return;

        const allLockers = extractArray(response.data, [
          "lockers",
          "data",
          "results",
        ]);

        // Compare the locker location reference with the URL ID.
        const matchingLockers = allLockers.filter(
          (locker) => getLockerLocationId(locker) === String(id)
        );

        setLockers(matchingLockers);
      } catch (err) {
        if (!active) return;

        console.error("Locker loading error:", err);
        setLockers([]);
        setLockerError(
          err.response?.data?.message ||
            "Location loaded, but lockers could not be fetched."
        );
      } finally {
        if (active) setLockersLoading(false);
      }
    }

    if (id) {
      loadLocation();
      loadLockers();
    } else {
      setError("Location ID is missing.");
      setLoading(false);
      setLockersLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  function handleSelectLocker(locker) {
    const lockerId = getId(locker);

    if (!lockerId) {
      setLockerError("This locker has no valid ID.");
      return;
    }

    navigate(`/book?locker=${encodeURIComponent(lockerId)}`);
  }

  if (loading) {
    return (
      <section className="ul-details-page">
        <div className="ul-details-container">
          <div className="ul-loading-panel">
            <div className="ul-spinner" />
            <h2>Finding your storage options...</h2>
            <p>Loading location information.</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !location) {
    return (
      <section className="ul-details-page">
        <div className="ul-details-container">
          <div className="ul-details-message">
            <span className="ul-details-message-icon">!</span>
            <h1>Location unavailable</h1>
            <p>{error || "We couldn't find this location."}</p>

            <Link
              to="/locations"
              className="ul-details-primary-button"
            >
              Back to locations
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const locationName =
    location.name ||
    location.title ||
    location.city ||
    "Storage location";

  const address =
    location.address ||
    location.fullAddress ||
    [
      location.city,
      location.state,
      location.pincode || location.postalCode,
    ]
      .filter(Boolean)
      .join(", ");

  const image =
    location.image || location.imageUrl || location.photo;

  return (
    <section className="ul-details-page">
      <div className="ul-details-container">
        <div className="ul-details-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/locations">Locations</Link>
          <span>/</span>
          <span>{locationName}</span>
        </div>

        <div className="ul-location-panel">
          <div className="ul-location-cover">
            {image ? (
              <img src={image} alt={locationName} />
            ) : (
              <div className="ul-location-cover-placeholder">
                <span aria-hidden="true">🧳</span>
                <span>UrbanLocker</span>
              </div>
            )}
          </div>

          <div className="ul-location-summary">
            <span className="ul-location-label">
              URBANLOCKER STORAGE
            </span>

            <h1>{locationName}</h1>

            {address && (
              <p className="ul-location-address">
                <span aria-hidden="true">📍</span> {address}
              </p>
            )}

            {location.description && (
              <p className="ul-location-description">
                {location.description}
              </p>
            )}

            <div className="ul-location-facts">
              <span>
                <strong>{lockers.length}</strong>
                {lockers.length === 1
                  ? " locker listed"
                  : " lockers listed"}
              </span>

              {location.city && <span>{location.city}</span>}
              {location.type && (
                <span>
                  {location.type.charAt(0).toUpperCase() +
                    location.type.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ul-lockers-section">
          <div className="ul-lockers-heading">
            <div>
              <span className="ul-location-label">
                FIND YOUR STORAGE
              </span>
              <h2>Available lockers</h2>
              <p>
                Review the lockers listed for this location.
              </p>
            </div>

            <Link to="/locations" className="ul-back-link">
              ← All locations
            </Link>
          </div>

          {lockersLoading ? (
            <div className="ul-details-message">
              <h3>Loading lockers...</h3>
            </div>
          ) : lockerError ? (
            <div className="ul-details-message">
              <h3>Lockers unavailable</h3>
              <p>{lockerError}</p>
            </div>
          ) : lockers.length === 0 ? (
            <div className="ul-details-message ul-lockers-empty">
              <span className="ul-details-message-icon">⌕</span>
              <h3>No lockers found for this location</h3>
              <p>
                This location loaded successfully, but no lockers
                were found with a matching location reference.
                Check the locker documents in your database.
              </p>

              <Link
                to="/locations"
                className="ul-details-primary-button"
              >
                Explore other locations
              </Link>
            </div>
          ) : (
            <div className="ul-lockers-grid">
              {lockers.map((locker, index) => (
                <LockerCard
                  key={locker._id || locker.id || index}
                  locker={locker}
                  onSelect={handleSelectLocker}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
