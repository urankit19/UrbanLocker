const express = require("express");

const {
  createLocation,
  getlocations,
  getLocationById,
  getNearbyLocations,
  updatelocation,
  deleteLocation,
} = require("../controllers/locationControllers");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getlocations);

router.get("/nearby", getNearbyLocations);

router.get("/:id", getLocationById);

// Admin routes
router.post(
  "/",
  protect,
  adminOnly,
  createLocation
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updatelocation
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteLocation
);

module.exports = router;