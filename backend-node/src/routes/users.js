const express = require("express");
const UserService = require("../services/userService");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const { validateRouteParams } = require("../middleware/validation");

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

/**
 * @swagger
 * /users/{username}:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get("/:username", validateRouteParams.username, async (req, res) => {
  try {
    const user = await UserService.getUserProfile(req.params.username);
    res.json(user);
  } catch (error) {
    console.error("Error getting user profile:", error);
    if (error.message === "User not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to get user profile" });
    }
  }
});

/**
 * @swagger
 * /users/{username}/preferences:
 *   get:
 *     tags: [Users]
 *     summary: Get user preferences
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preferences:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get(
  "/:username/preferences",
  validateRouteParams.username,
  async (req, res) => {
    try {
      const preferences = await User.getPreferences(req.params.username);
      res.json({
        preferences: preferences.map((p) => p.preference),
      });
    } catch (error) {
      console.error("Error getting user preferences:", error);
      res.status(500).json({ error: "Failed to get preferences" });
    }
  }
);

/**
 * @swagger
 * /users/{username}/preferences:
 *   post:
 *     tags: [Users]
 *     summary: Update user preferences
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.post(
  "/:username/preferences",
  authenticateToken,
  validateRouteParams.username,
  async (req, res) => {
    try {
      const { username } = req.params;
      const { preferences } = req.body;

      // Check if user is updating their own preferences
      if (req.user.sub !== username) {
        return res
          .status(403)
          .json({ error: "Can only update your own preferences" });
      }

      if (!Array.isArray(preferences)) {
        return res.status(400).json({ error: "Preferences must be an array" });
      }

      // Clear existing preferences and add new ones
      await User.clearPreferences(username);
      for (const pref of preferences) {
        await User.addPreference(username, pref);
      }

      res.json({ message: "Preferences updated successfully" });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  }
);

module.exports = router;
