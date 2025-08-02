const express = require("express");
const RestaurantService = require("../services/restaurantService");
const Restaurant = require("../models/Restaurant");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const {
  validateRestaurant,
  validateRouteParams,
} = require("../middleware/validation");

const router = express.Router();

/**
 * @swagger
 * /restaurants:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get all restaurants
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of restaurants
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const restaurants = await Restaurant.getAll();

    // Format restaurants for response
    const formattedRestaurants = restaurants
      .slice(0, limit)
      .map((restaurant) => ({
        restaurant_id: restaurant.restaurant_id,
        restaurant_name: restaurant.name,
        rating: parseFloat(restaurant.rating),
        url: restaurant.url_location,
        price_level: restaurant.price_level,
        summary: restaurant.summary,
        type: restaurant.type,
        reservable: restaurant.reservable,
        vegetarian: restaurant.vegetarian,
        price_range:
          restaurant.price_range_min > 0
            ? `(${restaurant.price_range_min}€-${restaurant.price_range_max}€)`
            : "",
      }));

    res.json(formattedRestaurants);
  } catch (error) {
    console.error("Error getting restaurants:", error);
    res.status(500).json({ error: "Failed to get restaurants" });
  }
});

/**
 * @swagger
 * /restaurants/{username}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get personalized restaurant recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Personalized restaurant recommendations
 */
router.get(
  "/:username",
  authenticateToken,
  validateRouteParams.username,
  async (req, res) => {
    try {
      const { username } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      // Verify the authenticated user matches the username
      if (req.user.sub !== username) {
        return res
          .status(403)
          .json({ error: "Cannot get recommendations for another user" });
      }

      const restaurants = await RestaurantService.getPersonalizedRestaurants(
        username,
        limit
      );
      res.json(restaurants);
    } catch (error) {
      console.error("Error getting personalized restaurants:", error);
      res
        .status(500)
        .json({ error: "Failed to get personalized recommendations" });
    }
  }
);

/**
 * @swagger
 * /restaurants:
 *   post:
 *     tags: [Restaurants]
 *     summary: Add a new restaurant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 */
router.post("/", authenticateToken, validateRestaurant, async (req, res) => {
  try {
    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      message: "Restaurant created successfully",
      restaurant: {
        restaurant_id: restaurant.restaurant_id,
        name: restaurant.name,
        rating: restaurant.rating,
        type: restaurant.type,
      },
    });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /restaurants/groups/{code}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurants for group selection
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Restaurants for group with like counts
 */
router.get("/groups/:code", validateRouteParams.groupCode, async (req, res) => {
  try {
    const { code } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const restaurants = await RestaurantService.getGroupRestaurants(
      code,
      limit
    );
    res.json(restaurants);
  } catch (error) {
    console.error("Error getting group restaurants:", error);
    res.status(500).json({ error: "Failed to get group restaurants" });
  }
});

/**
 * @swagger
 * /restaurants/{id}/like:
 *   post:
 *     tags: [Restaurants]
 *     summary: Like/unlike a restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               liked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Like status updated
 */
router.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, liked } = req.body;

    // Verify the authenticated user matches the username
    if (req.user.sub !== username) {
      return res
        .status(403)
        .json({ error: "Cannot like restaurant for another user" });
    }

    if (liked) {
      await Restaurant.likeRestaurant(username, id);
    } else {
      await Restaurant.unlikeRestaurant(username, id);
    }

    res.json({
      message: liked ? "Restaurant liked" : "Restaurant unliked",
      liked,
    });
  } catch (error) {
    console.error("Error updating restaurant like:", error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
