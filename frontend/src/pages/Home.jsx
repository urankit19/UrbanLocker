
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const destinations = [
  {
    name: "City Centre",
    area: "Convenient city access",
    price: "Explore options",
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Transport Hubs",
    area: "Travel without your bags",
    price: "Explore options",
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Shopping District",
    area: "Enjoy a hands-free day",
    price: "Explore options",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
  },
];

const benefits = [
  ["◈", "Secure storage", "Convenient storage for your belongings."],
  ["⌖", "Convenient locations", "Find a suitable location for your plans."],
  ["◷", "Flexible booking", "Choose a time that works for you."],
  ["₹", "Clear pricing", "Review the price before confirming."],
];

const steps = [
  ["01", "Find a location", "Search for convenient storage near your destination."],
  ["02", "Book your locker", "Choose a locker and select the time that suits you."],
  ["03", "Explore freely", "Leave your bags behind and make the most of your day."],
];

export default function Home() {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  function handleSearch(event) {
    event.preventDefault();
    const query = location.trim();
    navigate(`/locations${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#0B172A]">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2200&q=90"
          alt="Traveller exploring a new destination"
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071426]/95 via-[#071426]/75 to-[#071426]/25" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071426]/65 via-transparent to-[#071426]/10" />

        <div className="mx-auto grid min-h-[600px] max-w-7xl items-center gap-12 px-5 py-20 lg:min-h-[650px] lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your journey, without the baggage
            </div>

            <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Store your luggage.
              <span className="mt-2 block text-blue-400">Explore freely.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
              Discover convenient luggage storage near the places you love.
              Drop your bags, reclaim your day, and travel lighter.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-9 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl sm:flex-row sm:items-center"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
                <span className="text-xl text-blue-600" aria-hidden="true">⌕</span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Enter a city or location"
                  aria-label="Search city or location"
                  className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Find storage →
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span>✓ Simple booking</span>
              <span>✓ Clear pricing</span>
              <span>✓ Flexible plans</span>
            </div>
          </div>

          <div className="hidden justify-end lg:flex">
            <div className="max-w-xs rounded-3xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-2xl text-blue-300">
                ↗
              </div>
              <p className="mt-5 text-xl font-semibold">Make room for more.</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                More sights. More memories. Less time worrying about your bags.
              </p>
              <a href="#how-it-works" className="mt-5 inline-flex gap-2 text-sm font-semibold text-blue-300 hover:text-white">
                See how it works →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/[0.04] sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([icon, title, description], index) => (
            <div key={title} className={`flex gap-4 p-6 ${index > 0 ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl font-semibold text-blue-600">
                {icon}
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Explore with ease</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Find your perfect spot
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-slate-500">
              Discover storage options that fit your itinerary.
            </p>
          </div>
          <Link to="/locations" className="self-start text-sm font-semibold text-blue-600 hover:text-blue-700 sm:self-auto">
            Explore locations →
          </Link>
        </div>

        <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <article key={destination.name} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-56 overflow-hidden bg-slate-200">
                <img
                  src={destination.image}
                  alt={destination.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                  Discover nearby
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">{destination.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{destination.area}</p>
                <Link
                  to={`/locations?search=${encodeURIComponent(destination.name)}`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  {destination.price} →
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-xs text-slate-400">
          Live locations and prices will be connected to the backend in Phase 3.
        </p>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-slate-100 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Three simple steps</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Bags down. World up.
            </h2>
            <p className="mt-4 leading-7 text-slate-500">
              A straightforward way to make every travel day feel lighter.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <article key={number} className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-semibold text-blue-600">↗</span>
                  <span className="text-3xl font-bold text-slate-100">{number}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1100&q=85"
          alt="Airplane travelling through the sky"
          loading="lazy"
          className="h-80 w-full rounded-3xl object-cover sm:h-[420px]"
        />
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">A better way to explore</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Your bags shouldn't limit your plans.
          </h2>
          <p className="mt-5 leading-8 text-slate-500">
            UrbanLocker is designed to make luggage storage easier to discover
            and simpler to book. Spend less time managing your belongings and
            more time enjoying where you are.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            <li>✓ Easy-to-follow booking experience</li>
            <li>✓ Transparent prices before confirmation</li>
            <li>✓ Booking information in one place</li>
          </ul>
          <Link to="/locations" className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
            Find storage →
          </Link>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-slate-200 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <div className="mt-9 divide-y divide-slate-200">
            {[
              ["How do I book storage?", "Search for a location, select a locker, choose your time and follow the booking steps."],
              ["Can I choose my storage duration?", "Available durations and prices will be displayed for the selected locker."],
              ["How do I view my bookings?", "After creating an account and booking, you will be able to access My Bookings."],
            ].map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-800">
                  {question}
                  <span className="text-xl text-blue-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pr-8 text-sm leading-7 text-slate-500">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl rounded-3xl bg-[#0B172A] px-6 py-12 text-center sm:px-12 lg:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">Your next adventure awaits</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Make more memories. Carry less.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-300">
            Find a convenient storage spot and make more room for the moments that matter.
          </p>
          <Link to="/locations" className="mt-8 inline-flex rounded-xl bg-blue-500 px-7 py-4 text-sm font-semibold text-white transition hover:bg-blue-400">
            Explore locations →
          </Link>
        </div>
      </section>
    </>
  );
}
