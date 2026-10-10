
const jwt = require("jsonwebtoken");

// -------------------- AUTHENTICATION --------------------

const protect = (req, res, next) => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Authentication service is not configured.",
      });
    }

    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Not authorized. Token required.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Token required.",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
      });
    }

    console.error("JWT verification failed:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// -------------------- ADMIN AUTHORIZATION --------------------

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please log in first.",
    });
  }

  if (
    String(req.user.role || "").toLowerCase() !== "admin"
  ) {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  return next();
};

module.exports = {
  protect,
  adminOnly,
};
