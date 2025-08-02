const Restaurant = require("../models/Restaurant");
const Group = require("../models/Group");
const User = require("../models/User");

class MatchingService {
  static async checkRestaurantMatch(groupCode, restaurantId) {
    const memberCount = await Group.getMemberCount(groupCode);
    const likesCount = await Restaurant.getGroupLikes(groupCode, restaurantId);

    if (likesCount === memberCount && memberCount > 0) {
      const restaurant = await Restaurant.findById(restaurantId);
      return {
        isMatch: true,
        restaurantId,
        restaurantName: restaurant.name,
        totalMembers: memberCount,
        likesCount,
      };
    }

    return {
      isMatch: false,
      restaurantId,
      totalMembers: memberCount,
      likesCount,
    };
  }

  static async getRecommendationsForGroup(groupCode, limit = 10) {
    // Get all member vectors
    const memberVectors = await Group.getMemberVectors(groupCode);

    if (memberVectors.length === 0) {
      throw new Error("No group members found");
    }

    // In a real implementation, you'd:
    // 1. Average the member vectors
    // 2. Find restaurants with similar vectors
    // 3. Return ranked recommendations

    // For now, return basic recommendations
    return await Restaurant.getAll();
  }

  static calculateVectorSimilarity(vector1, vector2) {
    // Cosine similarity calculation
    if (!vector1 || !vector2 || vector1.length !== vector2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  static averageVectors(vectors) {
    if (!vectors || vectors.length === 0) return null;

    const length = vectors[0].length;
    const result = new Array(length).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < length; i++) {
        result[i] += vector[i];
      }
    }

    return result.map((val) => val / vectors.length);
  }
}

module.exports = MatchingService;
