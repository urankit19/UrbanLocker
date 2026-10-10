
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const bookingId = state?.bookingId;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("idle");

  useEffect(() => {
    if (!bookingId) {
      setMessage("Booking ID nahi mili. Pehle booking create karo.");
    }
  }, [bookingId]);

  const handlePayment = async (paymentMethod = "all") => {
    if (!bookingId || loading) return;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Razorpay Checkout load nahi ho paya.");
      }

      // Step 1: Create Razorpay order on the backend.
      const orderResponse = await api.post(
        "/payments/create-order",
        { bookingId }
      );

      const order = orderResponse.data;

      if (!order.orderId || !order.keyId) {
        throw new Error("Backend se valid payment order nahi mila.");
      }

      // Step 2: Open Razorpay Checkout.
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "UrbanLocker",
        description: "Luggage Storage Booking",
        order_id: order.orderId,
        prefill: {},
        ...(paymentMethod === "upi"
          ? {
              config: {
                display: {
                  blocks: {
                    upi: {
                      name: "Pay via UPI",
                      instruments: [{ method: "upi" }],
                    },
                  },
                  sequence: ["block.upi"],
                  preferences: { show_default_blocks: false },
                },
              },
            }
          : {}),
        theme: {
          color: "#2563eb",
        },

        handler: async (response) => {
          setPaymentStatus("verifying");
          setMessage("Payment received. Server par verify ho raha hai...");

          try {
            // Step 3: Verify payment on the backend.
            const verifyResponse = await api.post("/payments/verify", {
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (
              verifyResponse.data.paymentStatus !== "paid" ||
              verifyResponse.data.bookingStatus !== "confirmed"
            ) {
              throw new Error("Payment confirmation not received.");
            }

            setPaymentStatus("success");
            setMessage("Payment verified! Booking confirmed.");

            // Refresh My Bookings to display the confirmed booking.
            setTimeout(() => navigate("/my-bookings"), 1200);
          } catch (error) {
            setPaymentStatus("error");
            setMessage(
              error.response?.data?.message ||
                "Payment verification not completed . Check status in MyBooking"
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);

            if (paymentStatus !== "success") {
              setMessage(
                "Checkout close ho gaya. Payment status My Bookings mein check kar sakte ho."
              );
            }
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        setLoading(false);
        setPaymentStatus("error");
        setMessage(
          response.error?.description ||
            "Payment failed. Retry."
        );
      });

      checkout.open();
    } catch (error) {
      setLoading(false);
      setPaymentStatus("error");
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Payment not initiated."
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
          ₹
        </div>

        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Secure Checkout
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Complete your payment
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          UPI app ya supported device par QR scan se payment karo.
          Payment server se verify hone ke baad hi booking confirm hogi.
        </p>

        {bookingId && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">
              Booking ID
            </p>
            <p className="mt-1 break-all font-mono text-sm text-slate-800">
              {bookingId}
            </p>
          </div>
        )}

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-5 rounded-xl p-4 text-sm ${
              paymentStatus === "success"
                ? "bg-green-50 text-green-800"
                : paymentStatus === "error"
                  ? "bg-red-50 text-red-800"
                  : "bg-blue-50 text-blue-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => handlePayment("upi")}
            disabled={!bookingId || loading || paymentStatus === "success"}
            className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Processing..." : paymentStatus === "success" ? "Payment Verified" : "Pay with UPI / Scan QR"}
          </button>

          <button
            type="button"
            onClick={() => handlePayment("all")}
            disabled={!bookingId || loading || paymentStatus === "success"}
            className="w-full rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Other payment methods
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/my-bookings")}
          className="mt-3 w-full rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          View My Bookings
        </button>

        <p className="mt-5 text-center text-xs text-slate-500">
          Never share your OTP or payment credentials with anyone.
        </p>
      </section>
    </main>
  );
}
