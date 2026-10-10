const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookingsForAdmin,
  cancelBooking,
} = require("../controllers/bookingController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/admin/all", protect, adminOnly, getAllBookingsForAdmin);
router.patch("/admin/:id/cancel", protect, adminOnly, cancelBooking);
router.get("/:id", protect, getBookingById);
router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;
