const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const lockerRoutes = require("./routes/lockerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

//MiddleWare
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/lockers", lockerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

//Route Test
app.get("/", (req, res) => {
  res.json({
    message: "UrbanLocker is Runing"
  });
});

//Mongoose Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected Successfully");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection failed:", error.message);
  });