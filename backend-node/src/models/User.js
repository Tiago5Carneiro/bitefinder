const database = require("../config/database");

class User {
  static async findByUsername(username) {
    try {
      const users = await database.query(
        'SELECT * FROM "user" WHERE username = $1',
        [username]
      );
      return users[0] || null;
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const users = await database.query(
        'SELECT * FROM "user" WHERE email = $1',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  static async findByUsernameOrEmail(identifier) {
    try {
      const users = await database.query(
        'SELECT * FROM "user" WHERE username = $1 OR email = $1',
        [identifier]
      );
      return users[0] || null;
    } catch (error) {
      console.error("Error finding user by username or email:", error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const { username, name, email, password, food_vector, place_vector } =
        userData;

      const result = await database.query(
        `INSERT INTO "user" (username, name, password, email, food_vector, place_vector, history) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          username,
          name,
          password,
          email,
          JSON.stringify(food_vector),
          JSON.stringify(place_vector),
          0,
        ]
      );

      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async getPreferences(username) {
    try {
      return await database.query(
        "SELECT preference FROM user_preference WHERE username = $1 ORDER BY preference",
        [username]
      );
    } catch (error) {
      console.error("Error getting user preferences:", error);
      throw error;
    }
  }

  static async addPreference(username, preference) {
    try {
      return await database.query(
        "INSERT INTO user_preference (username, preference) VALUES ($1, $2)",
        [username, preference]
      );
    } catch (error) {
      console.error("Error adding user preference:", error);
      throw error;
    }
  }

  static async clearPreferences(username) {
    try {
      return await database.query(
        "DELETE FROM user_preference WHERE username = $1",
        [username]
      );
    } catch (error) {
      console.error("Error clearing user preferences:", error);
      throw error;
    }
  }

  static async updateVectors(
    username,
    food_vector,
    place_vector,
    history_food_vector,
    history_place_vector
  ) {
    try {
      return await database.query(
        'UPDATE "user" SET food_vector = $1, place_vector = $2, history_food_vector = $3, history_place_vector = $4, history = history + 1 WHERE username = $5',
        [
          JSON.stringify(food_vector),
          JSON.stringify(place_vector),
          JSON.stringify(history_food_vector),
          JSON.stringify(history_place_vector),
          username,
        ]
      );
    } catch (error) {
      console.error("Error updating user vectors:", error);
      throw error;
    }
  }

  static async addToHistory(username, restaurantId) {
    try {
      return await database.query(
        "INSERT INTO user_history (username, restaurant_id) VALUES ($1, $2)",
        [username, restaurantId]
      );
    } catch (error) {
      console.error("Error adding to user history:", error);
      throw error;
    }
  }

  static async getHistory(username) {
    try {
      return await database.query(
        `
        SELECT uh.id, uh.created_at, r.restaurant_id, r.name, r.rating, r.type, r.summary
        FROM user_history uh
        JOIN restaurant r ON uh.restaurant_id = r.restaurant_id
        WHERE uh.username = $1
        ORDER BY uh.created_at DESC
      `,
        [username]
      );
    } catch (error) {
      console.error("Error getting user history:", error);
      throw error;
    }
  }

  static async getAll() {
    try {
      return await database.query(
        'SELECT username, name, email, history, created_at FROM "user" ORDER BY created_at DESC'
      );
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  static async updateProfile(username, updateData) {
    try {
      const { name, email } = updateData;
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (name) {
        fields.push(`name = $${paramCount++}`);
        values.push(name);
      }

      if (email) {
        fields.push(`email = $${paramCount++}`);
        values.push(email);
      }

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(username);

      const result = await database.query(
        `UPDATE "user" SET ${fields.join(
          ", "
        )} WHERE username = $${paramCount} RETURNING username, name, email`,
        values
      );
      return result[0] || null;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  static async delete(username) {
    try {
      const result = await database.query(
        'DELETE FROM "user" WHERE username = $1 RETURNING username',
        [username]
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
}

module.exports = User;
