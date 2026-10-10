const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    locker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Locker",
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    totalHours: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "expired"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "not_required"],
      default: "pending",
    },

    refundStatus: {
      type: String,
      enum: ["not_applicable", "manual_required", "processed"],
      default: "not_applicable",
    },

    paymentId: {
      type: String,
      default: null,
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },


    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({
  locker: 1,
  startTime: 1,
  endTime: 1,
  bookingStatus: 1,
});

module.exports = mongoose.model("Booking", bookingSchema);
