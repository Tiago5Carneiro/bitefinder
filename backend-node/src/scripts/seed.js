const Database = require("../config/database");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10);

    await Database.query(
      `INSERT INTO "user" (username, name, password, email, food_vector, place_vector, history) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (username) DO NOTHING`,
      [
        "john_doe",
        "John Doe",
        hashedPassword,
        "john@example.com",
        JSON.stringify(
          Array(50)
            .fill(0)
            .map(() => Math.random())
        ),
        JSON.stringify(
          Array(50)
            .fill(0)
            .map(() => Math.random())
        ),
        0,
      ]
    );

    await Database.query(
      `INSERT INTO "user" (username, name, password, email, food_vector, place_vector, history) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (username) DO NOTHING`,
      [
        "jane_smith",
        "Jane Smith",
        hashedPassword,
        "jane@example.com",
        JSON.stringify(
          Array(50)
            .fill(0)
            .map(() => Math.random())
        ),
        JSON.stringify(
          Array(50)
            .fill(0)
            .map(() => Math.random())
        ),
        0,
      ]
    );

    // Add preferences
    const preferences = [
      "Italian",
      "Vegetarian",
      "Pizza",
      "Pasta",
      "City Center",
      "Outdoor Seating",
    ];
    for (const pref of preferences) {
      await Database.query(
        "INSERT INTO user_preference (username, preference) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        ["john_doe", pref]
      );
    }

    // Create sample restaurants
    const restaurants = [
      {
        id: "rest_001",
        name: "Pizza Bella",
        rating: 4.5,
        url: "https://pizzabella.com",
        type: "Italian",
        price_level: 2,
        price_min: 10,
        price_max: 25,
        vegetarian: true,
        reservable: true,
        summary: "Authentic Italian pizza with fresh ingredients",
      },
      {
        id: "rest_002",
        name: "Burger House",
        rating: 4.2,
        url: "https://burgerhouse.com",
        type: "American",
        price_level: 2,
        price_min: 8,
        price_max: 20,
        vegetarian: false,
        reservable: false,
        summary: "Gourmet burgers with homemade fries",
      },
      {
        id: "rest_003",
        name: "Green Garden",
        rating: 4.7,
        url: "https://greengarden.com",
        type: "Vegetarian",
        price_level: 3,
        price_min: 15,
        price_max: 30,
        vegetarian: true,
        reservable: true,
        summary: "Fresh organic vegetarian dishes",
      },
    ];

    for (const restaurant of restaurants) {
      await Database.query(
        `INSERT INTO restaurant (restaurant_id, name, rating, url_location, type, price_level, 
         price_range_min, price_range_max, vegetarian, reservable, summary, food_vector, place_vector) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (restaurant_id) DO NOTHING`,
        [
          restaurant.id,
          restaurant.name,
          restaurant.rating,
          restaurant.url,
          restaurant.type,
          restaurant.price_level,
          restaurant.price_min,
          restaurant.price_max,
          restaurant.vegetarian,
          restaurant.reservable,
          restaurant.summary,
          JSON.stringify(
            Array(50)
              .fill(0)
              .map(() => Math.random())
          ),
          JSON.stringify(
            Array(50)
              .fill(0)
              .map(() => Math.random())
          ),
        ]
      );
    }

    console.log("✅ Database seeded successfully!");
    console.log("👥 Created sample users: john_doe, jane_smith");
    console.log(
      "🍽️ Created sample restaurants: Pizza Bella, Burger House, Green Garden"
    );
    console.log("🔑 Default password for all users: password123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await Database.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
