
import { useEffect, useState } from "react";
import {
  Link,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import Locations from "./pages/Locations";
import LocationDetails from "./pages/LocationDetails";
import BookingForm from "./pages/BookingForm";
import MyBookings from "./pages/MyBookings";
import Payment from "./pages/Payment";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";

/* -------------------- HOMEPAGE DATA -------------------- */

const features = [
  {
    icon: "🔐",
    title: "Secure Storage",
    description: "Keep your belongings stored with care while you explore.",
  },
  {
    icon: "📍",
    title: "Convenient Locations",
    description: "Find storage options close to your destination.",
  },
  {
    icon: "🕒",
    title: "Flexible Booking",
    description: "Choose a time that fits your travel plans.",
  },
  {
    icon: "✦",
    title: "Simple Experience",
    description: "Book your storage in just a few straightforward steps.",
  },
];

const destinations = [
  {
    name: "City Centre",
    description: "Explore the heart of the city",
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Travel Hubs",
    description: "Make your journey easier",
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Shopping Districts",
    description: "Enjoy a hands-free day",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85",
  },
];

const steps = [
  {
    number: "01",
    title: "Find a location",
    description: "Search for a storage location that suits your plans.",
  },
  {
    number: "02",
    title: "Choose your locker",
    description: "Select your locker and preferred booking time.",
  },
  {
    number: "03",
    title: "Explore freely",
    description: "Leave your bags behind and enjoy your day.",
  },
];

const faqs = [
  {
    question: "How do I book luggage storage?",
    answer:
      "Search for a location, select an available locker, choose your time and follow the booking steps.",
  },
  {
    question: "Can I choose my storage duration?",
    answer:
      "Available durations and pricing will be shown for the selected locker.",
  },
  {
    question: "Where can I see my bookings?",
    answer:
      "Log in to access your booking history and booking information.",
  },
];

/* -------------------- AUTH HELPERS -------------------- */

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

/* -------------------- BRAND -------------------- */

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="UrbanLocker home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path
            d="M15 20V13a9 9 0 0 1 18 0v7"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect
            x="7"
            y="18"
            width="27"
            height="26"
            rx="6"
            fill="currentColor"
          />
          <path
            d="M27 23h9a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5h-9z"
            fill="#1677FF"
          />
          <circle cx="29" cy="31" r="2.5" fill="#fff" />
          <path
            d="M29 34v4"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span className="brand-name">
        Urban<span>Locker</span>
        <small>STORE TODAY. EXPLORE FREELY.</small>
      </span>
    </Link>
  );
}

/* -------------------- NAVBAR -------------------- */

function Navbar() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(() => ({
    token: localStorage.getItem("token"),
    user: getStoredUser(),
  }));
  useEffect(() => {
    function refreshSession() {
      setSession({ token: localStorage.getItem("token"), user: getStoredUser() });
    }
    window.addEventListener("urbanlocker:auth-change", refreshSession);
    window.addEventListener("storage", refreshSession);
    return () => {
      window.removeEventListener("urbanlocker:auth-change", refreshSession);
      window.removeEventListener("storage", refreshSession);
    };
  }, []);
  const { token, user } = session;
  const displayName = String(user?.name || "User").trim().split(/\s+/)[0];
  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin";

  function closeMenu() {
    setOpen(false);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("urbanlocker:auth-change"));
    closeMenu();
    window.location.assign("/");
  }

  const accountPath = isAdmin ? "/admin/dashboard" : "/my-bookings";
  const accountLabel = isAdmin ? "Admin Dashboard" : "My bookings";

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Brand />

        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((previous) => !previous)}
        >
          {open ? "✕" : "☰"}
        </button>

        <nav
          className={open ? "nav-links nav-open" : "nav-links"}
          aria-label="Main navigation"
        >
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          <Link to="/locations" onClick={closeMenu}>
            Locations
          </Link>

          <Link to="/howitworks" onClick={closeMenu}>
            How it works
          </Link>

          <Link to="/about" onClick={closeMenu}>
            About
          </Link>

          {token && (
            <Link to={accountPath} onClick={closeMenu}>
              {accountLabel}
            </Link>
          )}

          <div className="mobile-auth">
            {token ? (
              <>
                <span className="nav-welcome mobile-welcome">Welcome, <strong>{displayName}</strong></span>
                <Link to="/profile" className="button button-outline" onClick={closeMenu}>Profile</Link>
                <button type="button" className="button button-outline" onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="button button-outline"
                  onClick={closeMenu}
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="button button-primary"
                  onClick={closeMenu}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="nav-actions">
          {token ? (
            <>
              <span className="nav-welcome">Welcome, <strong>{displayName}</strong></span>
              <Link to="/profile" className="button button-outline">Profile</Link>
              <button type="button" className="button button-outline" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="button button-outline">
                Log in
              </Link>

              <Link to="/register" className="button button-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* -------------------- FOOTER -------------------- */

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-about">
          <Brand />
          <p>
            Your journey should be about the places you discover,
            not the bags you carry. Store your luggage and explore
            freely.
          </p>
        </div>

        <div>
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/locations">Find locations</Link>
          <Link to="/howitworks">How it works</Link>
        </div>

        <div>
          <h3>Account</h3>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
          <Link to="/my-bookings">My bookings</Link>
          <Link to="/profile">Profile</Link>
        </div>

        <div>
          <h3>Support</h3>
          <Link to="/#faq">FAQs</Link>
          <a href="mailto:support@urbanlocker.com">Contact us</a>
          <span>Travel lighter, every day.</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} UrbanLocker. All rights reserved.
        </span>
        <span>Store Today. Explore Freely.</span>
      </div>
    </footer>
  );
}

/* -------------------- HOME PAGE -------------------- */

function Home() {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  function handleSearch(event) {
    event.preventDefault();

    const query = location.trim();

    navigate(
      query
        ? `/locations?search=${encodeURIComponent(query)}`
        : "/locations"
    );
  }

  return (
    <>
      <section className="hero" id="home">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2200&q=90"
          alt="Traveller preparing to explore a new destination"
        />

        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="eyebrow">
            <span className="status-dot" />
            YOUR JOURNEY, WITHOUT THE BAGGAGE
          </div>

          <h1>
            Store your luggage.
            <span>Explore freely.</span>
          </h1>

          <p className="hero-description">
            Discover convenient luggage storage near the places you love.
            Drop your bags, reclaim your day, and travel lighter.
          </p>

          <form className="search-box" onSubmit={handleSearch}>
            <label className="search-input">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle
                  cx="10.5"
                  cy="10.5"
                  r="6.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m15.5 15.5 4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Enter a city or location"
                aria-label="Search city or location"
              />
            </label>

            <button
              className="button button-primary search-button"
              type="submit"
            >
              Find storage <span>→</span>
            </button>
          </form>

          <div className="hero-points">
            <span>✓ Easy booking</span>
            <span>✓ Clear pricing</span>
            <span>✓ Flexible plans</span>
          </div>
        </div>

        <div className="hero-note">
          <span className="hero-note-icon">↗</span>
          <h3>Make room for more.</h3>
          <p>
            More sights. More memories. Less time worrying about your bags.
          </p>
          <Link to="/howitworks">See how it works →</Link>
        </div>
      </section>

      <section className="features section-container">
        {features.map((feature) => (
          <article className="feature" key={feature.title}>
            <div className="feature-icon">{feature.icon}</div>
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section
        className="destinations section-container"
        id="locations-preview"
      >
        <div className="section-heading">
          <div>
            <span className="section-label">EXPLORE WITH EASE</span>
            <h2>Find your perfect spot.</h2>
            <p>Discover storage options that fit your itinerary.</p>
          </div>

          <Link to="/locations" className="text-link">
            Explore locations →
          </Link>
        </div>

        <div className="destination-grid">
          {destinations.map((destination) => (
            <article className="destination-card" key={destination.name}>
              <div className="destination-image">
                <img
                  src={destination.image}
                  alt={destination.name}
                  loading="lazy"
                />
                <span>DISCOVER NEARBY</span>
              </div>

              <div className="destination-body">
                <h3>{destination.name}</h3>
                <p>{destination.description}</p>

                <Link
                  to={`/locations?search=${encodeURIComponent(
                    destination.name
                  )}`}
                  className="destination-link"
                >
                  Explore options <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="demo-note">
          Browse the Locations page to see storage options available in your
          database.
        </p>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-container">
          <div className="center-heading">
            <span className="section-label">THREE SIMPLE STEPS</span>
            <h2>Bags down. World up.</h2>
            <p>
              A straightforward way to make every travel day feel lighter.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <div className="step-top">
                  <span className="step-icon">↗</span>
                  <span className="step-number">{step.number}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section section-container" id="about">
        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85"
            alt="Airplane travelling through the sky"
            loading="lazy"
          />

          <div className="about-image-note">
            <strong>Travel lighter.</strong>
            <span>Enjoy more of every journey.</span>
          </div>
        </div>

        <div className="about-content">
          <span className="section-label">A BETTER WAY TO EXPLORE</span>
          <h2>Your bags shouldn't limit your plans.</h2>

          <p>
            UrbanLocker is designed to make luggage storage easier to
            discover and simpler to book. Spend less time managing your
            belongings and more time enjoying where you are.
          </p>

          <ul>
            <li>✓ Easy-to-follow booking experience</li>
            <li>✓ Clear prices before confirmation</li>
            <li>✓ Booking information in one place</li>
          </ul>

          <Link
            to="/locations"
            className="button button-primary about-button"
          >
            Find storage →
          </Link>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-inner">
          <div className="center-heading">
            <span className="section-label">NEED TO KNOW?</span>
            <h2>Frequently asked questions.</h2>
          </div>

          {faqs.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>
                {faq.question}
                <span>+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta section-container">
        <span className="section-label">YOUR NEXT ADVENTURE AWAITS</span>
        <h2>Make more memories. Carry less.</h2>
        <p>
          Find a convenient storage spot and make more room for the moments
          that matter.
        </p>
        <Link to="/locations" className="button button-primary">
          Explore locations →
        </Link>
      </section>
    </>
  );
}

/* -------------------- ADMIN ROUTE GUARD -------------------- */

function HomeSection({ sectionId }) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [sectionId]);

  return <Home />;
}

function AdminRoute() {
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin";

  if (!token || !isAdmin) {
    return <Login />;
  }

  return <AdminDashboard />;
}

/* -------------------- NOT FOUND -------------------- */

function NotFound() {
  return (
    <section className="placeholder-page">
      <span className="section-label">URBANLOCKER</span>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="button button-primary">
        Back to home
      </Link>
    </section>
  );
}

/* -------------------- APP ROUTING -------------------- */

export default function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/howitworks" element={<HomeSection sectionId="how-it-works" />} />
          <Route path="/how-it-works" element={<HomeSection sectionId="how-it-works" />} />
          <Route path="/about" element={<HomeSection sectionId="about" />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/locations" element={<Locations />} />
          <Route
            path="/locations/:id"
            element={<LocationDetails />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book" element={<BookingForm />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/payment" element={<Payment />} />
          <Route
            path="/admin/dashboard"
            element={<AdminRoute />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
