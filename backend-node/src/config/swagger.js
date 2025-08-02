const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BiteFinder API",
      version: "1.0.0",
      description: "Restaurant matching app API",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://your-production-url.com"
            : `http://localhost:${process.env.PORT || 5000}`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // User schemas - baseado no model User
        User: {
          type: "object",
          properties: {
            username: {
              type: "string",
              example: "john_doe",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            food_vector: {
              type: "array",
              items: { type: "number" },
              example: [0.1, 0.2, 0.3],
            },
            place_vector: {
              type: "array",
              items: { type: "number" },
              example: [0.4, 0.5, 0.6],
            },
            history_food_vector: {
              type: "array",
              items: { type: "number" },
              example: [0.7, 0.8, 0.9],
            },
            history_place_vector: {
              type: "array",
              items: { type: "number" },
              example: [0.1, 0.3, 0.5],
            },
            history: {
              type: "integer",
              example: 5,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["username", "name", "email", "password"],
          properties: {
            username: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              example: "john_doe",
            },
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              example: "password123",
            },
            food_preferences: {
              type: "array",
              items: { type: "string" },
              example: ["Italian", "Mexican", "Pizza"],
            },
            place_preferences: {
              type: "array",
              items: { type: "string" },
              example: ["Outdoor", "City Center", "Romantic"],
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["password"],
          properties: {
            username: {
              type: "string",
              example: "testuser",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              example: "password123",
            },
          },
          anyOf: [
            {
              required: ["username", "password"],
            },
            {
              required: ["email", "password"],
            },
          ],
          description: "Login with username+password OR email+password",
        },
        UserPreference: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            username: {
              type: "string",
              example: "john_doe",
            },
            preference: {
              type: "string",
              example: "Italian",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        UserHistory: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            username: {
              type: "string",
              example: "john_doe",
            },
            restaurant_id: {
              type: "string",
              example: "rest_001",
            },
            name: {
              type: "string",
              example: "Pizza Bella",
            },
            rating: {
              type: "number",
              example: 4.5,
            },
            type: {
              type: "string",
              example: "Italian",
            },
            summary: {
              type: "string",
              example: "Great pizza place",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        // Group schemas - baseado no model Group
        Group: {
          type: "object",
          properties: {
            code: {
              type: "string",
              minLength: 6,
              maxLength: 6,
              example: "ABC123",
            },
            name: {
              type: "string",
              example: "Friday Dinner",
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "selecting", "matched"],
              example: "active",
            },
            creator_username: {
              type: "string",
              example: "john_doe",
            },
            max_members: {
              type: "integer",
              example: 6,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        GroupMember: {
          type: "object",
          properties: {
            username: {
              type: "string",
              example: "john_doe",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            is_ready: {
              type: "boolean",
              example: false,
            },
            is_host: {
              type: "boolean",
              example: true,
            },
            joined_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        GroupUser: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            group_code: {
              type: "string",
              example: "ABC123",
            },
            username: {
              type: "string",
              example: "john_doe",
            },
            is_ready: {
              type: "boolean",
              example: false,
            },
            joined_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        // Restaurant schemas - baseado no model Restaurant
        Restaurant: {
          type: "object",
          required: ["restaurant_id", "name", "rating", "type"],
          properties: {
            restaurant_id: {
              type: "string",
              example: "rest_001",
            },
            name: {
              type: "string",
              example: "Pizza Bella",
            },
            rating: {
              type: "number",
              format: "float",
              minimum: 0,
              maximum: 5,
              example: 4.5,
            },
            url_location: {
              type: "string",
              format: "uri",
              example: "https://pizzabella.com",
            },
            food_vector: {
              type: "array",
              items: { type: "number" },
              example: [0.1, 0.2, 0.3],
            },
            place_vector: {
              type: "array",
              items: { type: "number" },
              example: [0.4, 0.5, 0.6],
            },
            price_range_max: {
              type: "integer",
              minimum: 0,
              example: 25,
            },
            price_range_min: {
              type: "integer",
              minimum: 0,
              example: 10,
            },
            price_level: {
              type: "integer",
              minimum: 1,
              maximum: 4,
              example: 2,
            },
            type: {
              type: "string",
              example: "Italian",
            },
            reservable: {
              type: "boolean",
              example: true,
            },
            vegetarian: {
              type: "boolean",
              example: true,
            },
            summary: {
              type: "string",
              example: "Authentic Italian pizza with fresh ingredients",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        RestaurantWithLikes: {
          allOf: [
            { $ref: "#/components/schemas/Restaurant" },
            {
              type: "object",
              properties: {
                likes_count: {
                  type: "integer",
                  example: 3,
                },
                user_liked: {
                  type: "boolean",
                  example: true,
                },
              },
            },
          ],
        },
        Photo: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            url: {
              type: "string",
              format: "uri",
              example: "https://example.com/photo.jpg",
            },
            restaurant_id: {
              type: "string",
              example: "rest_001",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Schedule: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            restaurant_id: {
              type: "string",
              example: "rest_001",
            },
            day: {
              type: "string",
              enum: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
              example: "monday",
            },
            start_time: {
              type: "string",
              format: "time",
              example: "09:00",
            },
            end_time: {
              type: "string",
              format: "time",
              example: "22:00",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        UserRestaurant: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            username: {
              type: "string",
              example: "john_doe",
            },
            restaurant_id: {
              type: "string",
              example: "rest_001",
            },
            liked_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        // Request/Response schemas
        CreateGroupRequest: {
          type: "object",
          required: ["name", "username"],
          properties: {
            name: {
              type: "string",
              example: "Friday Dinner",
            },
            username: {
              type: "string",
              example: "john_doe",
            },
          },
        },
        JoinGroupRequest: {
          type: "object",
          required: ["code", "username"],
          properties: {
            code: {
              type: "string",
              minLength: 6,
              maxLength: 6,
              example: "ABC123",
            },
            username: {
              type: "string",
              example: "jane_doe",
            },
          },
        },
        UpdateReadyRequest: {
          type: "object",
          required: ["username", "is_ready"],
          properties: {
            username: {
              type: "string",
              example: "john_doe",
            },
            is_ready: {
              type: "boolean",
              example: true,
            },
          },
        },
        LeaveGroupRequest: {
          type: "object",
          required: ["username"],
          properties: {
            username: {
              type: "string",
              example: "john_doe",
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Validation failed",
                  },
                },
              },
            },
          },
        },
        UnauthorizedError: {
          description: "Authentication required",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Access token required",
                  },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Permission denied",
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Resource not found",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customSiteTitle: "BiteFinder API Documentation",
      customfavIcon: "/favicon.ico",
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
  console.log("📖 Swagger documentation available at /api-docs");
}

module.exports = setupSwagger;
