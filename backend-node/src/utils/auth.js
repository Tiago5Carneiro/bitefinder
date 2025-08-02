const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRATION_DAYS = 7;

class AuthUtils {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(username) {
    const payload = {
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION_DAYS * 24 * 60 * 60,
      iat: Math.floor(Date.now() / 1000),
      sub: username,
    };
    return jwt.sign(payload, JWT_SECRET);
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}

module.exports = AuthUtils;
