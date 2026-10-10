const mongoose = require("mongoose");

const lockerSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    lockerNumber: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: String,
      enum: ["small", "medium", "large"],
      required: true,
    },

    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },

    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["available", "maintenance"],
      default: "available",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    activeBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


lockerSchema.index(
  {
    location: 1, lockerNumber: 1
  },
  { unique: true }
);

module.exports = mongoose.model("Locker", lockerSchema);
