const Booking = require("../models/Booking");
const Locker = require("../models/Locker");
const Location = require("../models/Location");

async function expireEndedBookings() {
  const expiredBookings = await Booking.find({
    bookingStatus: { $in: ["pending", "confirmed"] },
    endTime: { $lte: new Date() },
  }).select("_id locker");

  for (const booking of expiredBookings) {
    const result = await Booking.updateOne(
      {
        _id: booking._id,
        bookingStatus: { $in: ["pending", "confirmed"] },
      },
      { $set: { bookingStatus: "expired" } }
    );

    if (!result.modifiedCount) continue;

    const locker = await Locker.findOneAndUpdate(
      { _id: booking.locker, activeBooking: booking._id },
      { $set: { activeBooking: null } },
      { returnDocument: "after" }
    );

    if (locker?.status === "available" && locker.isActive) {
      await Location.updateOne(
        { _id: locker.location },
        { $inc: { availableLockers: 1 } }
      );
    }
  }
}

module.exports = { expireEndedBookings };