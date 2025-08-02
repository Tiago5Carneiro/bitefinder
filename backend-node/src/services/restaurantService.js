const Restaurant = require("../models/Restaurant");
const Group = require("../models/Group");

class RestaurantService {
  static async getPersonalizedRestaurants(username, limit = 10) {
    // This is simplified - you'll need to implement proper recommendation logic
    const restaurants = await Restaurant.getAll();

    // Get user likes
    const userLikes = await Restaurant.getUserLikes(username);
    const likedIds = userLikes.map((r) => r.restaurant_id);

    // Format restaurants
    return restaurants.slice(0, limit).map((restaurant) => {
      const photos = [];
      return {
        restaurant_id: restaurant.restaurant_id,
        restaurant_name: restaurant.name,
        rating: parseFloat(restaurant.rating),
        url: restaurant.url_location,
        price_level: restaurant.price_level,
        summary: restaurant.summary,
        images: photos,
        price_range:
          restaurant.price_range_min > 0
            ? `(${restaurant.price_range_min}€-${restaurant.price_range_max}€)`
            : "",
        type: restaurant.type,
        reservable: restaurant.reservable,
        vegetarian: restaurant.vegetarian,
        is_liked: likedIds.includes(restaurant.restaurant_id),
      };
    });
  }

  static async getGroupRestaurants(groupCode, limit = 10) {
    const restaurants = await Restaurant.getAll();

    // Get group member count for match calculation
    const memberCount = await Group.getMemberCount(groupCode);

    // Format restaurants with group like information
    const formattedRestaurants = [];

    for (const restaurant of restaurants.slice(0, limit)) {
      const likesCount = await Restaurant.getGroupLikes(
        groupCode,
        restaurant.restaurant_id
      );
      const photos = await Restaurant.getPhotos(restaurant.restaurant_id);

      formattedRestaurants.push({
        restaurant_id: restaurant.restaurant_id,
        restaurant_name: restaurant.name,
        rating: parseFloat(restaurant.rating),
        url: restaurant.url_location,
        price_level: restaurant.price_level,
        summary: restaurant.summary,
        images: photos.map((p) => p.url),
        price_range:
          restaurant.price_range_min > 0
            ? `(${restaurant.price_range_min}€-${restaurant.price_range_max}€)`
            : "",
        type: restaurant.type,
        reservable: restaurant.reservable,
        vegetarian: restaurant.vegetarian,
        likes_count: likesCount,
        total_members: memberCount,
      });
    }

    return formattedRestaurants;
  }

  static async voteRestaurant(groupCode, restaurantId, username, liked) {
    if (liked) {
      await Restaurant.likeRestaurant(username, restaurantId);
    } else {
      await Restaurant.unlikeRestaurant(username, restaurantId);
    }

    // Check for match
    const memberCount = await Group.getMemberCount(groupCode);
    const likesCount = await Restaurant.getGroupLikes(groupCode, restaurantId);

    if (likesCount === memberCount && memberCount > 0) {
      // We have a match!
      const restaurant = await Restaurant.findById(restaurantId);
      await Group.updateStatus(groupCode, "matched");

      return {
        isMatch: true,
        restaurant: {
          restaurant_id: restaurantId,
          name: restaurant.name,
          rating: restaurant.rating,
          url: restaurant.url_location,
        },
      };
    }

    return { isMatch: false };
  }

  static async recordUserHistory(username, restaurantId) {
    await User.addToHistory(username, restaurantId);

    // Update user vectors based on history (simplified)
    // In a real implementation, you'd calculate proper embeddings
    const historyRestaurants = await Restaurant.getUserLikes(username);

    if (historyRestaurants.length > 0) {
      // This is placeholder logic - implement proper vector averaging
      const avgFoodVector = Array(50)
        .fill(0)
        .map(() => Math.random());
      const avgPlaceVector = Array(50)
        .fill(0)
        .map(() => Math.random());

      await User.updateVectors(
        username,
        avgFoodVector,
        avgPlaceVector,
        avgFoodVector,
        avgPlaceVector
      );
    }
  }
}

module.exports = RestaurantService;
