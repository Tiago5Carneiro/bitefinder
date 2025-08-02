const express = require("express");
const UserService = require("../services/userService");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const user = await UserService.registerUser(req.body);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Login with either username or email along with password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             loginWithUsername:
 *               summary: Login with username
 *               value:
 *                 username: "john_doe"
 *                 password: "password123"
 *             loginWithEmail:
 *               summary: Login with email
 *               value:
 *                 email: "john@example.com"
 *                 password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: "john_doe"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     preferences:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Italian", "Pizza", "City Center"]
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid credentials"
 */
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email;

    const result = await UserService.loginUser(identifier, password);

    res.json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  "/verify",
  require("../middleware/auth").authenticateToken,
  async (req, res) => {
    try {
      const user = await UserService.getUserProfile(req.user.sub);

      res.json({
        valid: true,
        user: {
          username: user.username,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  }
);

module.exports = router;
