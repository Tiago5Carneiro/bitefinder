const jwt = require("jsonwebtoken");
const AuthUtils = require("../utils/auth");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = AuthUtils.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = AuthUtils.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token inválido, mas continua sem autenticação
    }
  }

  next();
};

const generateToken = (username) => {
  return AuthUtils.generateToken(username);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
};
