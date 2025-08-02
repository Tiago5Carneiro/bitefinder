const express = require("express");
const GroupService = require("../services/groupService");
const Group = require("../models/Group");
const { authenticateToken } = require("../middleware/auth");
const {
  validateGroupCreation,
  validateGroupJoin,
  validateReadyStatus,
  validateGroupLeave,
  validateRouteParams,
} = require("../middleware/validation");

const router = express.Router();

/**
 * @swagger
 * /groups/create:
 *   post:
 *     tags: [Groups]
 *     summary: Create a new group
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created successfully
 */
router.post(
  "/create",
  authenticateToken,
  validateGroupCreation,
  async (req, res) => {
    try {
      const { name, username } = req.body;

      // Verify the authenticated user matches the username
      if (req.user.sub !== username) {
        return res
          .status(403)
          .json({ error: "Cannot create group for another user" });
      }

      const group = await GroupService.createGroup(name, username);

      res.status(201).json({
        message: "Group created successfully",
        group: {
          code: group.code,
          name: group.name,
          creator_username: group.creator_username,
          status: group.status,
        },
      });
    } catch (error) {
      console.error("Group creation error:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /groups/join:
 *   post:
 *     tags: [Groups]
 *     summary: Join an existing group
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully joined group
 */
router.post("/join", authenticateToken, validateGroupJoin, async (req, res) => {
  try {
    const { code, username } = req.body;

    // Verify the authenticated user matches the username
    if (req.user.sub !== username) {
      return res
        .status(403)
        .json({ error: "Cannot join group for another user" });
    }

    const group = await GroupService.joinGroup(code, username);

    res.json({
      message: "Successfully joined group",
      group: {
        code: group.code,
        name: group.name,
        status: group.status,
      },
    });
  } catch (error) {
    console.error("Group join error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /groups/{code}:
 *   get:
 *     tags: [Groups]
 *     summary: Get group details
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details with members
 */
router.get("/:code", validateRouteParams.groupCode, async (req, res) => {
  try {
    const group = await GroupService.getGroupWithMembers(req.params.code);
    res.json(group);
  } catch (error) {
    console.error("Error getting group:", error);
    if (error.message === "Group not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to get group" });
    }
  }
});

/**
 * @swagger
 * /groups/{code}/members:
 *   get:
 *     tags: [Groups]
 *     summary: Get group members
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of group members
 */
router.get(
  "/:code/members",
  validateRouteParams.groupCode,
  async (req, res) => {
    try {
      const members = await Group.getMembers(req.params.code);
      res.json({ members });
    } catch (error) {
      console.error("Error getting group members:", error);
      res.status(500).json({ error: "Failed to get group members" });
    }
  }
);

/**
 * @swagger
 * /groups/{code}/ready:
 *   post:
 *     tags: [Groups]
 *     summary: Update member ready status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
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
 *               username:
 *                 type: string
 *               is_ready:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Ready status updated
 */
router.post(
  "/:code/ready",
  authenticateToken,
  validateRouteParams.groupCode,
  validateReadyStatus,
  async (req, res) => {
    try {
      const { code } = req.params;
      const { username, is_ready } = req.body;

      // Verify the authenticated user matches the username
      if (req.user.sub !== username) {
        return res
          .status(403)
          .json({ error: "Cannot update ready status for another user" });
      }

      const result = await GroupService.updateReadyStatus(
        code,
        username,
        is_ready
      );

      res.json({
        message: "Ready status updated",
        all_ready: result.allReady,
        member_count: result.memberCount,
      });
    } catch (error) {
      console.error("Error updating ready status:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /groups/{code}/leave:
 *   post:
 *     tags: [Groups]
 *     summary: Leave group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
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
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully left group
 */
router.post(
  "/:code/leave",
  authenticateToken,
  validateRouteParams.groupCode,
  validateGroupLeave,
  async (req, res) => {
    try {
      const { code } = req.params;
      const { username } = req.body;

      // Verify the authenticated user matches the username
      if (req.user.sub !== username) {
        return res
          .status(403)
          .json({ error: "Cannot leave group for another user" });
      }

      const result = await GroupService.leaveGroup(code, username);

      res.json({
        message: result.dissolved
          ? "Group dissolved"
          : "Successfully left group",
        dissolved: result.dissolved,
      });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
