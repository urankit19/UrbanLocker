
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";

function getLocationsArray(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.locations)) return data.locations;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.locations)) return data.data.locations;

  return [];
}

function LocationCard({ location }) {
  const id = location._id || location.id;
  const name = location.name || location.title || "Storage location";
  const address =
    location.address ||
    location.fullAddress ||
    [location.city, location.state].filter(Boolean).join(", ") ||
    "Address available in location details";

  const image =
    location.image ||
    location.imageUrl ||
    location.photo ||
    location.images?.[0];

  return (
    <article className="location-card">
      <div className="location-card-image">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <div className="location-image-placeholder">
            <span aria-hidden="true">🧳</span>
            <span>UrbanLocker Storage</span>
          </div>
        )}

        <span className="location-badge">Verified location</span>
      </div>

      <div className="location-card-body">
        <p className="location-eyebrow">
          <span aria-hidden="true">📍</span>{" "}
          {location.city || location.state || "Convenient location"}
        </p>

        <h2>{name}</h2>
        <p className="location-address">{address}</p>

        {location.description && (
          <p className="location-description">{location.description}</p>
        )}

        <div className="location-card-footer">
          <span className="location-status">
            <span className="status-dot" />
            Explore storage
          </span>

          {id ? (
            <Link
              className="location-view-button"
              to={`/locations/${id}`}
            >
              View details <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span className="location-view-button is-disabled">
              Details unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Locations() {
  const [searchParams] = useSearchParams();
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchLocations() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/locations");

        if (active) {
          setLocations(getLocationsArray(response));
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "We couldn't load locations. Please check your connection and try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchLocations();

    return () => {
      active = false;
    };
  }, []);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return locations;

    return locations.filter((location) => {
      const searchableText = [
        location.name,
        location.title,
        location.address,
        location.fullAddress,
        location.city,
        location.state,
        location.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [locations, search]);

  return (
    <section className="locations-page">
      <div className="locations-hero">
        <div className="locations-hero-inner">
          <div className="locations-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Locations</span>
          </div>

          <span className="locations-kicker">
            YOUR NEXT ADVENTURE STARTS HERE
          </span>

          <h1>
            Find a place for your bags.
            <br />
            <span>Make room for adventure.</span>
          </h1>

          <p>
            Discover convenient luggage storage locations and explore
            more without carrying your bags around.
          </p>

          <label className="locations-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search by city, area or address..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search locations"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </label>
        </div>
      </div>

      <div className="locations-content">
        <div className="locations-heading-row">
          <div>
            <p className="section-eyebrow">EXPLORE URBANLOCKER</p>
            <h2>Storage locations</h2>
            <p className="locations-subtitle">
              Find a convenient place to leave your luggage.
            </p>
          </div>

          {!loading && !error && (
            <span className="location-count">
              {filteredLocations.length}{" "}
              {filteredLocations.length === 1 ? "location" : "locations"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="location-grid" aria-label="Loading locations">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="location-skeleton" key={index}>
                <div className="skeleton-image" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="locations-message locations-error" role="alert">
            <span className="message-icon" aria-hidden="true">!</span>
            <h3>Couldn't load locations</h3>
            <p>{error}</p>
            <button
              className="location-view-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="locations-message">
            <span className="message-icon" aria-hidden="true">⌕</span>
            <h3>
              {locations.length === 0
                ? "No locations available yet"
                : "No matching locations"}
            </h3>
            <p>
              {locations.length === 0
                ? "Locations will appear here once they are available in the database."
                : "Try another city, area or address."}
            </p>
            {search && (
              <button
                className="location-view-button"
                onClick={() => setSearch("")}
              >
                Show all locations
              </button>
            )}
          </div>
        ) : (
          <div className="location-grid">
            {filteredLocations.map((location, index) => (
              <LocationCard
                key={location._id || location.id || index}
                location={location}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
