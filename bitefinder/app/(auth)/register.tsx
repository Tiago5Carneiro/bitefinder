import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  View,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/contexts/AuthContext";

// place preference
const AMBIANCE_OPTIONS = [
  "Rustic",
  "Modern",
  "Futuristic",
  "Minimalistic",
  "Nature",
  "Indoor",
  "Outdoor",
];
const COLOR_OPTIONS = [
  "Warm",
  "Cool",
  "Neutral",
  "Vibrant",
  "Dark",
  "Light",
  "Colorful",
];
const PRICE_OPTIONS = ["Budget-friendly", "Mid-Range", "Upscale"];
const CROWD_OPTIONS = ["Quiet", "Lively"];
const CUISINE_OPTIONS = [
  "Traditional",
  "Gourmet",
  "Cousy",
  "Exotic",
  "Fusion",
  "Street Food",
  "Fast Food",
  "Healthy",
  "Vegetarian",
  "Vegan",
];

// food preference
const FLAVOR_OPTIONS = [
  "Sweet",
  "Savory",
  "Spicy",
  "Sour",
  "Umami",
  "Bitter",
  "Smoky",
  "Tangy",
  "Herbal",
];
const TEXTURE_OPTIONS = [
  "Crispy",
  "Creamy",
  "Crunchy",
  "Tender",
  "Juicy",
  "Chewy",
  "Flaky",
  "Silky",
  "Soft",
];
const PRESENTATION_OPTIONS = [
  "Plated",
  "Buffet",
  "Bento",
  "Bowl",
  "Tasting Menu",
  "Handheld",
];
const MEAL_OPTIONS = [
  "Breakfast",
  "Brunch",
  "Lunch",
  "Dinner",
  "Late Night",
  "Snacks",
  "Dessert",
];
const INGREDIENT_OPTIONS = [
  "Organic",
  "Local",
  "Seasonal",
  "Farm-to-Table",
  "Foraged",
  "Sustainable",
  "Seafood-Based",
  "Plant-Based",
];

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // place preferences
  const [ambiancePreference, setAmbiancePreference] = useState("");
  const [colorPreference, setColorPreference] = useState("");
  const [pricePreference, setPricePreference] = useState("");
  const [crowdPreference, setCrowdPreference] = useState("");
  const [cuisinePreference, setCuisinePreference] = useState("");

  // food preferences
  const [flavourPreference, setflavourPreference] = useState("");
  const [texturePreference, setTexturePreference] = useState("");
  const [presentationPreference, setPresentationPreference] = useState("");
  const [mealPreference, setMealPreference] = useState("");
  const [ingredientPreference, setIngredientPreference] = useState("");

  const { signUp } = useAuth();

  const inputBackground = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");

  const handleRegister = async () => {
    // Basic validation
    if (!username || !name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const place_preferences = [];
      const food_preferences = [];
      if (ambiancePreference) place_preferences.push(ambiancePreference);
      if (colorPreference) place_preferences.push(colorPreference);
      if (pricePreference) place_preferences.push(pricePreference);
      if (crowdPreference) place_preferences.push(crowdPreference);
      if (cuisinePreference) place_preferences.push(cuisinePreference);

      if (flavourPreference) food_preferences.push(flavourPreference);
      if (texturePreference) food_preferences.push(texturePreference);
      if (presentationPreference) food_preferences.push(presentationPreference);
      if (mealPreference) food_preferences.push(mealPreference);
      if (ingredientPreference) food_preferences.push(ingredientPreference);

      console.log("place_preferences", place_preferences);
      console.log("food_preferences", food_preferences);

      await signUp(
        username,
        name,
        email,
        password,
        place_preferences,
        food_preferences
      );
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Option selection component
  const renderOptions = (
    options: string[],
    selectedValue: string,
    setSelectedValue: (value: string) => void,
    title: string
  ) => (
    <View style={styles.preferencesSection}>
      <ThemedText style={styles.preferenceTitle}>{title}</ThemedText>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              { borderColor: borderColor },
              selectedValue === option && {
                backgroundColor: tintColor,
                borderColor: tintColor,
              },
            ]}
            onPress={() => setSelectedValue(option)}
          >
            <ThemedText
              style={[
                styles.optionText,
                selectedValue === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Create Account
        </ThemedText>

        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : null}

        <TextInput
          style={[
            styles.input,
            { backgroundColor: inputBackground, color: textColor },
          ]}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={[
            styles.input,
            { backgroundColor: inputBackground, color: textColor },
          ]}
          placeholder="Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[
            styles.input,
            { backgroundColor: inputBackground, color: textColor },
          ]}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[
            styles.input,
            { backgroundColor: inputBackground, color: textColor },
          ]}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={[
            styles.input,
            { backgroundColor: inputBackground, color: textColor },
          ]}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <View style={styles.preferencesContainer}>
          <ThemedText type="subtitle" style={styles.preferencesTitle}>
            Food Preferences (Optional)
          </ThemedText>

          {renderOptions(
            AMBIANCE_OPTIONS,
            ambiancePreference,
            setAmbiancePreference,
            "Ambiance"
          )}

          {renderOptions(
            COLOR_OPTIONS,
            colorPreference,
            setColorPreference,
            "Color Scheme"
          )}

          {renderOptions(
            PRICE_OPTIONS,
            pricePreference,
            setPricePreference,
            "Price Range"
          )}

          {renderOptions(
            CROWD_OPTIONS,
            crowdPreference,
            setCrowdPreference,
            "Atmosphere"
          )}

          {renderOptions(
            CUISINE_OPTIONS,
            cuisinePreference,
            setCuisinePreference,
            "Cuisine Type"
          )}

          {renderOptions(
            FLAVOR_OPTIONS,
            flavourPreference,
            setflavourPreference,
            "Flavor Preference"
          )}

          {renderOptions(
            TEXTURE_OPTIONS,
            texturePreference,
            setTexturePreference,
            "Texture"
          )}

          {renderOptions(
            PRESENTATION_OPTIONS,
            presentationPreference,
            setPresentationPreference,
            "Presentation"
          )}

          {renderOptions(
            MEAL_OPTIONS,
            mealPreference,
            setMealPreference,
            "Meal Preference"
          )}

          {renderOptions(
            INGREDIENT_OPTIONS,
            ingredientPreference,
            setIngredientPreference,
            "Ingredient Preference"
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: tintColor },
            isSubmitting && styles.disabledButton,
          ]}
          onPress={handleRegister}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <ThemedText type="link" style={styles.linkText}>
            Already have an account? Sign in
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    paddingVertical: 40,
  },
  title: {
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  linkText: {
    marginTop: 20,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  preferencesContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  preferencesTitle: {
    marginBottom: 15,
    textAlign: "center",
  },
  preferencesSection: {
    marginBottom: 15,
  },
  preferenceTitle: {
    marginBottom: 8,
    fontWeight: "500",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 5,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
  },
  selectedOptionText: {
    color: "white",
  },
});
