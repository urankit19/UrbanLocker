const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["railway", "airport", "tourist"],
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
    },

    pincode: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    totalLockers: { type: Number, default: 0, min: 0 },
    availableLockers: { type: Number, default: 0, min: 0 },
  },

  {
    timestamps: true,
  }
);


locationSchema.index({
  location: "2dsphere",
});

module.exports = mongoose.model("Location", locationSchema);
