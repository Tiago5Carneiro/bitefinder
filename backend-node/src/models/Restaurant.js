const database = require("../config/database");

class Restaurant {
  static async create(restaurantData) {
    try {
      const {
        restaurant_id,
        name,
        rating,
        url_location,
        food_vector,
        place_vector,
        price_range_max,
        price_range_min,
        price_level,
        type,
        reservable,
        vegetarian,
        summary,
      } = restaurantData;

      const result = await database.query(
        `
        INSERT INTO restaurant (
          restaurant_id, name, rating, url_location, food_vector, place_vector,
          price_range_max, price_range_min, price_level, type, reservable, vegetarian, summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `,
        [
          restaurant_id,
          name,
          rating,
          url_location,
          food_vector ? JSON.stringify(food_vector) : null,
          place_vector ? JSON.stringify(place_vector) : null,
          price_range_max,
          price_range_min,
          price_level,
          type,
          reservable,
          vegetarian,
          summary,
        ]
      );

      return result[0];
    } catch (error) {
      console.error("Error creating restaurant:", error);
      throw error;
    }
  }

  static async findById(restaurantId) {
    try {
      const restaurants = await database.query(
        "SELECT * FROM restaurant WHERE restaurant_id = $1",
        [restaurantId]
      );
      return restaurants[0] || null;
    } catch (error) {
      console.error("Error finding restaurant by ID:", error);
      throw error;
    }
  }

  static async getAll() {
    try {
      return await database.query(
        "SELECT * FROM restaurant ORDER BY rating DESC"
      );
    } catch (error) {
      console.error("Error getting all restaurants:", error);
      throw error;
    }
  }

  static async getByType(type) {
    try {
      return await database.query(
        `
        SELECT * FROM restaurant 
        WHERE LOWER(type) = LOWER($1) 
        ORDER BY rating DESC
      `,
        [type]
      );
    } catch (error) {
      console.error("Error getting restaurants by type:", error);
      throw error;
    }
  }

  static async getByPriceLevel(priceLevel) {
    try {
      return await database.query(
        `
        SELECT * FROM restaurant 
        WHERE price_level = $1 
        ORDER BY rating DESC
      `,
        [priceLevel]
      );
    } catch (error) {
      console.error("Error getting restaurants by price level:", error);
      throw error;
    }
  }

  static async getVegetarianFriendly() {
    try {
      return await database.query(`
        SELECT * FROM restaurant 
        WHERE vegetarian = true 
        ORDER BY rating DESC
      `);
    } catch (error) {
      console.error("Error getting vegetarian restaurants:", error);
      throw error;
    }
  }

  static async getPhotos(restaurantId) {
    try {
      return await database.query(
        "SELECT url FROM photo WHERE restaurant_id = $1",
        [restaurantId]
      );
    } catch (error) {
      console.error("Error getting restaurant photos:", error);
      throw error;
    }
  }

  static async addPhoto(restaurantId, photoUrl) {
    try {
      return await database.query(
        "INSERT INTO photo (url, restaurant_id) VALUES ($1, $2)",
        [photoUrl, restaurantId]
      );
    } catch (error) {
      console.error("Error adding restaurant photo:", error);
      throw error;
    }
  }

  static async getSchedules(restaurantId) {
    try {
      return await database.query(
        "SELECT * FROM schedule WHERE restaurant_id = $1 ORDER BY day, start_time",
        [restaurantId]
      );
    } catch (error) {
      console.error("Error getting restaurant schedules:", error);
      throw error;
    }
  }

  static async addSchedule(restaurantId, day, startTime, endTime) {
    try {
      return await database.query(
        "INSERT INTO schedule (restaurant_id, day, start_time, end_time) VALUES ($1, $2, $3, $4)",
        [restaurantId, day, startTime, endTime]
      );
    } catch (error) {
      console.error("Error adding restaurant schedule:", error);
      throw error;
    }
  }

  static async likeRestaurant(username, restaurantId) {
    try {
      return await database.query(
        "INSERT INTO user_restaurant (username, restaurant_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [username, restaurantId]
      );
    } catch (error) {
      console.error("Error liking restaurant:", error);
      throw error;
    }
  }

  static async unlikeRestaurant(username, restaurantId) {
    try {
      return await database.query(
        "DELETE FROM user_restaurant WHERE username = $1 AND restaurant_id = $2",
        [username, restaurantId]
      );
    } catch (error) {
      console.error("Error unliking restaurant:", error);
      throw error;
    }
  }

  static async isLikedByUser(username, restaurantId) {
    try {
      const result = await database.query(
        "SELECT 1 FROM user_restaurant WHERE username = $1 AND restaurant_id = $2",
        [username, restaurantId]
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if restaurant is liked:", error);
      throw error;
    }
  }

  static async getGroupLikes(groupCode, restaurantId) {
    try {
      const result = await database.query(
        `
        SELECT COUNT(*) as likes_count 
        FROM user_restaurant ur
        JOIN group_user gu ON ur.username = gu.username
        WHERE gu.group_code = $1 AND ur.restaurant_id = $2
      `,
        [groupCode, restaurantId]
      );

      return parseInt(result[0].likes_count);
    } catch (error) {
      console.error("Error getting group likes for restaurant:", error);
      throw error;
    }
  }

  static async getUserLikes(username) {
    try {
      return await database.query(
        `
        SELECT r.*
        FROM restaurant r
        JOIN user_restaurant ur ON r.restaurant_id = ur.restaurant_id
        WHERE ur.username = $1
        ORDER BY ur.liked_at DESC
      `,
        [username]
      );
    } catch (error) {
      console.error("Error getting user likes:", error);
      throw error;
    }
  }

  static async search(query) {
    try {
      const searchQuery = `%${query.toLowerCase()}%`;
      return await database.query(
        `
        SELECT * FROM restaurant
        WHERE LOWER(name) LIKE $1 
           OR LOWER(type) LIKE $1 
           OR LOWER(summary) LIKE $1
        ORDER BY rating DESC
      `,
        [searchQuery]
      );
    } catch (error) {
      console.error("Error searching restaurants:", error);
      throw error;
    }
  }

  static async update(restaurantId, updateData) {
    try {
      const allowedFields = [
        "name",
        "rating",
        "url_location",
        "price_range_max",
        "price_range_min",
        "price_level",
        "type",
        "reservable",
        "vegetarian",
        "summary",
      ];

      const fields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          fields.push(`${key} = $${paramCount++}`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        throw new Error("No valid fields to update");
      }

      values.push(restaurantId);

      const result = await database.query(
        `UPDATE restaurant SET ${fields.join(
          ", "
        )} WHERE restaurant_id = $${paramCount} RETURNING *`,
        values
      );
      return result[0] || null;
    } catch (error) {
      console.error("Error updating restaurant:", error);
      throw error;
    }
  }

  static async delete(restaurantId) {
    try {
      const result = await database.query(
        "DELETE FROM restaurant WHERE restaurant_id = $1 RETURNING restaurant_id",
        [restaurantId]
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      throw error;
    }
  }
}

module.exports = Restaurant;
