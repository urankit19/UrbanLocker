const express = require("express");

const {
  createLocker,
  getLockers,
  getLockerById,
  updateLocker,
  deleteLocker,
} = require("../controllers/lockerController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getLockers);
router.get("/:id", getLockerById);

router.post("/", protect, adminOnly, createLocker);
router.put("/:id", protect, adminOnly, updateLocker);
router.delete("/:id", protect, adminOnly, deleteLocker);


module.exports = router;
