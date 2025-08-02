const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");

class UserService {
  static async registerUser(userData) {
    const {
      username,
      name,
      email,
      password,
      food_preferences,
      place_preferences,
    } = userData;

    // Check if user already exists
    const existingUser = await User.findByUsernameOrEmail(username);
    const existingEmail = await User.findByEmail(email);

    if (existingUser || existingEmail) {
      throw new Error("Username or email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create basic vectors (you'll need to implement proper vectorization)
    const food_vector = this.createBasicVector(food_preferences);
    const place_vector = this.createBasicVector(place_preferences);

    // Create user
    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      food_vector,
      place_vector,
    });

    // Add preferences
    for (const pref of [...food_preferences, ...place_preferences]) {
      await User.addPreference(username, pref);
    }

    return user;
  }

  static async loginUser(identifier, password) {
    const user = await User.findByUsernameOrEmail(identifier);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken(user.username);
    const preferences = await User.getPreferences(user.username);

    return {
      token,
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
        preferences: preferences.map((p) => p.preference),
      },
    };
  }

  static async getUserProfile(username) {
    const user = await User.findByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const preferences = await User.getPreferences(username);

    return {
      username: user.username,
      name: user.name,
      email: user.email,
      preferences: preferences.map((p) => p.preference),
      history: user.history,
      created_at: user.created_at,
    };
  }

  // Basic vector creation (replace with actual vectorization logic)
  static createBasicVector(preferences) {
    // This is a placeholder - implement proper vectorization
    return preferences.map(() => Math.random()).slice(0, 50);
  }
}

module.exports = UserService;
