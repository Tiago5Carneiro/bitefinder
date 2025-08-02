const validateRegistration = (req, res, next) => {
  const {
    username,
    name,
    email,
    password,
    food_preferences,
    place_preferences,
  } = req.body;

  const errors = [];

  // Validar campos obrigatórios
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    errors.push("Name is required");
  }

  if (!email || typeof email !== "string" || !isValidEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!Array.isArray(food_preferences) || food_preferences.length === 0) {
    errors.push("At least one food preference is required");
  }

  if (!Array.isArray(place_preferences) || place_preferences.length === 0) {
    errors.push("At least one place preference is required");
  }

  // Validar formato do username (apenas letras, números e underscore)
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { username, email, password } = req.body;

  const errors = [];

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  }

  if (!username && !email) {
    errors.push("Either username or email is required");
  }

  if (email && !isValidEmail(email)) {
    errors.push("Valid email format required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

const validateGroupCreation = (req, res, next) => {
  const { name, username } = req.body;

  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    errors.push("Group name is required and must be at least 1 character");
  }

  if (name && name.length > 100) {
    errors.push("Group name must not exceed 100 characters");
  }

  if (!username || typeof username !== "string" || username.trim().length < 1) {
    errors.push("Username is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

const validateGroupJoin = (req, res, next) => {
  const { code, username } = req.body;

  const errors = [];

  if (!code || typeof code !== "string" || code.trim().length !== 6) {
    errors.push("Valid 6-character group code is required");
  }

  if (!username || typeof username !== "string" || username.trim().length < 1) {
    errors.push("Username is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

const validateRestaurant = (req, res, next) => {
  const {
    restaurant_id,
    name,
    rating,
    url_location,
    price_range_max,
    price_range_min,
    price_level,
    type,
    summary,
  } = req.body;

  const errors = [];

  if (!restaurant_id || typeof restaurant_id !== "string") {
    errors.push("Restaurant ID is required");
  }

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    errors.push("Restaurant name is required");
  }

  if (
    rating === undefined ||
    typeof rating !== "number" ||
    rating < 0 ||
    rating > 5
  ) {
    errors.push("Rating must be a number between 0 and 5");
  }

  if (!url_location || typeof url_location !== "string") {
    errors.push("URL location is required");
  }

  if (
    price_range_max !== undefined &&
    (typeof price_range_max !== "number" || price_range_max < 0)
  ) {
    errors.push("Price range max must be a positive number");
  }

  if (
    price_range_min !== undefined &&
    (typeof price_range_min !== "number" || price_range_min < 0)
  ) {
    errors.push("Price range min must be a positive number");
  }

  if (
    price_level !== undefined &&
    (typeof price_level !== "number" || price_level < 1 || price_level > 4)
  ) {
    errors.push("Price level must be a number between 1 and 4");
  }

  if (!type || typeof type !== "string") {
    errors.push("Restaurant type is required");
  }

  if (!summary || typeof summary !== "string" || summary.trim().length < 1) {
    errors.push("Restaurant summary is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

const validateReadyStatus = (req, res, next) => {
  const { username, is_ready } = req.body;

  const errors = [];

  if (!username || typeof username !== "string") {
    errors.push("Username is required");
  }

  if (typeof is_ready !== "boolean") {
    errors.push("is_ready must be a boolean value");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

const validateGroupLeave = (req, res, next) => {
  const { username } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({
      error: "Username is required",
    });
  }

  next();
};

const validateRestaurantVote = (data) => {
  const { group_code, restaurant_id, username, liked } = data;

  if (!group_code || typeof group_code !== "string") {
    return "Group code is required";
  }

  if (!restaurant_id || typeof restaurant_id !== "string") {
    return "Restaurant ID is required";
  }

  if (!username || typeof username !== "string") {
    return "Username is required";
  }

  if (typeof liked !== "boolean") {
    return "Liked status must be a boolean";
  }

  return null; // No errors
};

// Helper function para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Middleware para validar parâmetros de rota
const validateRouteParams = {
  username: (req, res, next) => {
    const { username } = req.params;
    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length < 1
    ) {
      return res
        .status(400)
        .json({ error: "Valid username parameter required" });
    }
    next();
  },

  groupCode: (req, res, next) => {
    const { code } = req.params;
    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return res
        .status(400)
        .json({ error: "Valid 6-character group code required" });
    }
    next();
  },
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateGroupCreation,
  validateGroupJoin,
  validateRestaurant,
  validateReadyStatus,
  validateGroupLeave,
  validateRestaurantVote,
  validateRouteParams,
};
