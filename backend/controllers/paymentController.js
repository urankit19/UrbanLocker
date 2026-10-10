
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const { expireEndedBookings } = require("../services/bookingLifecycle");

// Initialize Razorpay using server-side environment variables
const getRazorpayInstance = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    throw new Error("Razorpay API keys are not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Create Payment Order
const createPaymentOrder = async (req, res) => {
  try {
    await expireEndedBookings();
    const { bookingId } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        message: "A valid bookingId is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (
      booking.bookingStatus !== "pending" ||
      booking.paymentStatus !== "pending"
    ) {
      return res.status(400).json({
        message: "Only pending, unpaid bookings can be paid",
      });
    }

    if (
      !Number.isFinite(booking.totalAmount) ||
      booking.totalAmount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid booking amount",
      });
    }

    // Return existing order if one was already created.
    if (booking.razorpayOrderId) {
      return res.status(200).json({
        message: "Payment order already exists",
        orderId: booking.razorpayOrderId,
        amount: Math.round(booking.totalAmount * 100),
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
      });
    }

    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(booking.totalAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: booking.bookingReference || booking._id.toString(),
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user.userId.toString(),
      },
    });

    // Save the order ID without validating unrelated legacy fields.
    const result = await Booking.updateOne(
      {
        _id: booking._id,
        user: req.user.userId,
        bookingStatus: "pending",
        paymentStatus: "pending",
        razorpayOrderId: null,
      },
      {
        $set: {
          razorpayOrderId: order.id,
        },
      }
    );

    if (result.modifiedCount !== 1) {
      return res.status(409).json({
        message:
          "Could not save payment order. Check the booking before retrying.",
      });
    }

    return res.status(201).json({
      message: "Payment order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      message: "Failed to create payment order",
    });
  }
};

// Verify Payment and Confirm Booking
const verifyPayment = async (req, res) => {
  try {
    await expireEndedBookings();
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(bookingId) ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "All payment verification fields are required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(409).json({
        message: "Booking payment is already verified",
      });
    }

    if (
      booking.bookingStatus !== "pending" ||
      booking.paymentStatus !== "pending"
    ) {
      return res.status(400).json({
        message: "Booking is not eligible for payment verification",
      });
    }

    if (
      !booking.razorpayOrderId ||
      booking.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        message: "Payment order does not match this booking",
      });
    }

    // Validate Razorpay signature with the server-side secret.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (
      !/^[a-f0-9]{64}$/i.test(razorpay_signature)
    ) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    const expected = Buffer.from(expectedSignature, "hex");
    const received = Buffer.from(razorpay_signature, "hex");

    if (
      expected.length !== received.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    // Confirm actual captured payment status with Razorpay.
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.amount !== Math.round(booking.totalAmount * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        message:
          "Payment is not captured or payment details do not match",
      });
    }

    // Update only the relevant fields for legacy booking compatibility.
    const result = await Booking.updateOne(
      {
        _id: booking._id,
        user: req.user.userId,
        razorpayOrderId: razorpay_order_id,
        bookingStatus: "pending",
        paymentStatus: "pending",
      },
      {
        $set: {
          paymentStatus: "paid",
          paymentId: razorpay_payment_id,
          bookingStatus: "confirmed",
        },
      }
    );

    if (result.modifiedCount !== 1) {
      // A payment may be captured while the customer cancels from another
      // tab. Keep the cancellation and locker release, but record that a
      // manual refund is now required instead of losing the captured payment.
      const cancelledPayment = await Booking.updateOne(
        {
          _id: booking._id,
          user: req.user.userId,
          razorpayOrderId: razorpay_order_id,
          bookingStatus: "cancelled",
          paymentStatus: "pending",
        },
        {
          $set: {
            paymentStatus: "paid",
            paymentId: razorpay_payment_id,
            refundStatus: "manual_required",
          },
        }
      );
      if (cancelledPayment.modifiedCount === 1) {
        return res.status(409).json({
          message: "Payment was captured after cancellation. The booking remains cancelled; contact support to arrange a refund.",
          paymentStatus: "paid",
          bookingStatus: "cancelled",
          refundStatus: "manual_required",
        });
      }
      return res.status(409).json({
        message: "Booking status changed; check booking status",
      });
    }

    return res.status(200).json({
      message: "Payment verified and booking confirmed",
      bookingId: booking._id,
      paymentId: razorpay_payment_id,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      message: "Failed to verify payment",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
};
