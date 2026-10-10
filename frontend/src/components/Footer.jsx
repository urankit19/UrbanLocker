
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0B172A] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2">
          <Link to="/" aria-label="UrbanLocker home">
            <img
              src="/logo.svg"
              alt="UrbanLocker"
              className="h-12 w-auto rounded-lg bg-white p-1"
            />
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
            Explore more. Carry less. Find convenient luggage storage
            and enjoy your journey without the extra weight.
          </p>
          <p className="mt-4 text-sm font-medium text-blue-400">
            Store Today. Explore Freely.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Explore</h3>
          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
            <Link className="hover:text-white" to="/">Home</Link>
            <Link className="hover:text-white" to="/locations">Find locations</Link>
            <a className="hover:text-white" href="/#how-it-works">How it works</a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Support</h3>
          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
            <a className="hover:text-white" href="/#faq">FAQs</a>
            <a className="hover:text-white" href="mailto:support@urbanlocker.com">
              Contact support
            </a>
            <span>Secure storage. Easy travel.</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} UrbanLocker. All rights reserved.</p>
          <p>Built for lighter journeys.</p>
        </div>
      </div>
    </footer>
  );
}
