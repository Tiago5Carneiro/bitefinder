const { Pool } = require("pg");

class Database {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "shiftappens_db",
      user: process.env.DB_USER || "diogo",
      password: process.env.DB_PASSWORD || "bytefinder",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Debug: mostra a configuração (remove em produção)
    console.log("Database config:", {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "shiftappens_db",
      user: process.env.DB_USER || "diogo",
    });
  }

  async query(text, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async initializeDatabase() {
    try {
      // Test connection
      await this.query("SELECT NOW()");
      console.log("📊 Database connected successfully");

      // Create tables if they don't exist
      await this.createTables();
      console.log("📋 All tables created/verified");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }
  }

  async createTables() {
    const createTablesSQL = `
      -- User table
      CREATE TABLE IF NOT EXISTS "user" (
        username VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        food_vector JSONB,
        place_vector JSONB,
        history_food_vector JSONB,
        history_place_vector JSONB,
        history INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User preferences table
      CREATE TABLE IF NOT EXISTS user_preference (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) REFERENCES "user"(username) ON DELETE CASCADE,
        preference VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Restaurant table
      CREATE TABLE IF NOT EXISTS restaurant (
        restaurant_id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        rating DECIMAL(3,2),
        url_location TEXT,
        food_vector JSONB,
        place_vector JSONB,
        price_range_max INTEGER,
        price_range_min INTEGER,
        price_level INTEGER,
        type VARCHAR(100),
        reservable BOOLEAN DEFAULT false,
        vegetarian BOOLEAN DEFAULT false,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Group table
      CREATE TABLE IF NOT EXISTS "group" (
        code VARCHAR(6) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        creator_username VARCHAR(50) REFERENCES "user"(username) ON DELETE CASCADE,
        max_members INTEGER DEFAULT 6,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Group user junction table
      CREATE TABLE IF NOT EXISTS group_user (
        id SERIAL PRIMARY KEY,
        group_code VARCHAR(6) REFERENCES "group"(code) ON DELETE CASCADE,
        username VARCHAR(50) REFERENCES "user"(username) ON DELETE CASCADE,
        is_ready BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_code, username)
      );

      -- User restaurant likes
      CREATE TABLE IF NOT EXISTS user_restaurant (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) REFERENCES "user"(username) ON DELETE CASCADE,
        restaurant_id VARCHAR(100) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, restaurant_id)
      );

      -- User history
      CREATE TABLE IF NOT EXISTS user_history (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) REFERENCES "user"(username) ON DELETE CASCADE,
        restaurant_id VARCHAR(100) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Photo table
      CREATE TABLE IF NOT EXISTS photo (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        restaurant_id VARCHAR(100) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Schedule table
      CREATE TABLE IF NOT EXISTS schedule (
        id SERIAL PRIMARY KEY,
        restaurant_id VARCHAR(100) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE,
        day VARCHAR(10) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
      CREATE INDEX IF NOT EXISTS idx_user_preference_username ON user_preference(username);
      CREATE INDEX IF NOT EXISTS idx_group_creator ON "group"(creator_username);
      CREATE INDEX IF NOT EXISTS idx_group_user_group ON group_user(group_code);
      CREATE INDEX IF NOT EXISTS idx_group_user_username ON group_user(username);
      CREATE INDEX IF NOT EXISTS idx_user_restaurant_username ON user_restaurant(username);
      CREATE INDEX IF NOT EXISTS idx_user_restaurant_restaurant ON user_restaurant(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_restaurant_type ON restaurant(type);
      CREATE INDEX IF NOT EXISTS idx_restaurant_rating ON restaurant(rating);
    `;

    await this.query(createTablesSQL);
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new Database();
