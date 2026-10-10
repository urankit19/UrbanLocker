
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Locker = require("../models/Locker");
const Location = require("../models/Location");
const { expireEndedBookings } = require("../services/bookingLifecycle");

// Create Booking - Authenticated User
const createBooking = async (req, res) => {
  try {
    await expireEndedBookings();
    const { locker, startTime, endTime } = req.body;

    if (!locker || !startTime || !endTime) {
      return res.status(400).json({
        message: "Locker, start time and end time are required",
      });
    }

    if (!mongoose.isValidObjectId(locker)) {
      return res.status(400).json({
        message: "Invalid locker ID",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid start or end time",
      });
    }

    if (start <= new Date() || end <= start) {
      return res.status(400).json({
        message:
          "Start time must be in the future and end time must be after start time",
      });
    }

    const selectedLocker = await Locker.findOne({
      _id: locker,
      isActive: true,
      status: "available",
    });

    if (!selectedLocker) {
      return res.status(404).json({
        message: "Available locker not found",
      });
    }

    const activeLocation = await Location.exists({
      _id: selectedLocker.location,
      isActive: true,
    });
    if (!activeLocation) {
      return res.status(404).json({ message: "Active location not found" });
    }

    const bookingId = new mongoose.Types.ObjectId();
    const claimedLocker = await Locker.findOneAndUpdate(
      { _id: selectedLocker._id, isActive: true, status: "available", activeBooking: null },
      { $set: { activeBooking: bookingId } },
      { returnDocument: "after" }
    );
    if (!claimedLocker) {
      return res.status(409).json({
        message: "Locker is already reserved. Please choose another locker.",
      });
    }

    const locationClaim = await Location.updateOne(
      { _id: claimedLocker.location, availableLockers: { $gt: 0 } },
      { $inc: { availableLockers: -1 } }
    );
    if (locationClaim.modifiedCount !== 1) {
      await Locker.updateOne({ _id: claimedLocker._id, activeBooking: bookingId }, { $set: { activeBooking: null } });
      return res.status(409).json({ message: "No lockers are currently available at this location." });
    }

    const totalHours = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    );

    const wholeDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    const totalAmount =
      wholeDays * selectedLocker.pricePerDay +
      remainingHours * selectedLocker.pricePerHour;

    const bookingReference =
      "UL-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8).toUpperCase();

    let booking;
    try { booking = await Booking.create({
      _id: bookingId,
      user: req.user.userId,
      locker: selectedLocker._id,
      startTime: start,
      endTime: end,
      totalHours,
      totalAmount,
      bookingStatus: totalAmount === 0 ? "confirmed" : "pending",
      paymentStatus: totalAmount === 0 ? "not_required" : "pending",
      bookingReference,
    }); } catch (error) {
      await Locker.updateOne({ _id: claimedLocker._id, activeBooking: bookingId }, { $set: { activeBooking: null } });
      await Location.updateOne({ _id: claimedLocker.location }, { $inc: { availableLockers: 1 } });
      throw error;
    }

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (
      error.name === "CastError" ||
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message: "Invalid booking data",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};

// Get Current User's Bookings
const getMyBookings = async (req, res) => {
  try {
    await expireEndedBookings();
    const bookings = await Booking.find({
      user: req.user.userId,
    })
      .populate({ path: "locker", populate: { path: "location", select: "name city address" } })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};

// Get One Booking - Owner Only
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      user: req.user.userId,
    }).populate({ path: "locker", populate: { path: "location", select: "name city address" } });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      message: "Failed to fetch booking",
    });
  }
};

// Admin booking view. Customer records are only returned to admins.
const getAllBookingsForAdmin = async (req, res) => {
  try {
    await expireEndedBookings();
    const bookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .populate({
        path: "locker",
        populate: { path: "location", select: "name city address" },
      });

    return res.status(200).json({ count: bookings.length, bookings });
  } catch (error) {
    console.error("Get admin bookings error:", error.message);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// Customers may cancel their own booking; admins may cancel any booking.
// Paid bookings are cancelled with a manual refund required marker because
// this application does not issue payment refunds automatically.
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const isAdmin = String(req.user.role || "").toLowerCase() === "admin";
    const ownershipFilter = isAdmin ? {} : { user: req.user.userId };
    const booking = await Booking.findOne({ _id: id, ...ownershipFilter });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (
      booking.bookingStatus === "cancelled" ||
      booking.bookingStatus === "completed" ||
      booking.bookingStatus === "expired"
    ) {
      return res.status(400).json({
        message: "Booking cannot be cancelled",
      });
    }

    // Update only relevant fields to avoid validation errors
    // caused by older records missing totalAmount.
    const cancellationFields = { bookingStatus: "cancelled" };
    if (booking.paymentStatus === "paid") {
      cancellationFields.refundStatus = "manual_required";
    }
    const result = await Booking.updateOne(
      {
        _id: booking._id,
        ...ownershipFilter,
        bookingStatus: { $in: ["pending", "confirmed"] },
      },
      {
        $set: cancellationFields,
      }
    );

    if (result.modifiedCount !== 1) {
      return res.status(409).json({
        message:
          "Booking status changed or booking can no longer be cancelled",
      });
    }

    const locker = await Locker.findOneAndUpdate(
      { _id: booking.locker, activeBooking: booking._id },
      { $set: { activeBooking: null } },
      { returnDocument: "after" }
    );
    if (locker?.status === "available" && locker.isActive) {
      await Location.updateOne({ _id: locker.location }, { $inc: { availableLockers: 1 } });
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate({ path: "locker", populate: { path: "location", select: "name city address" } });

    return res.status(200).json({
      message: booking.paymentStatus === "paid"
        ? "Booking cancelled. A manual refund is required."
        : "Booking cancelled successfully",
      refundStatus: booking.paymentStatus === "paid" ? "manual_required" : "not_applicable",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    return res.status(500).json({
      message: "Failed to cancel booking",
    });
  }
};


module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookingsForAdmin,
  cancelBooking,
};
