const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/authControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);
router.patch("/me", protect, updateCurrentUser);

module.exports = router;
