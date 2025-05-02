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

// Food preference options
const AMBIANCE_OPTIONS = ["Rustic", "Modern"];
const PRICE_OPTIONS = ["Budget-friendly", "Upscale"];
const CROWD_OPTIONS = ["Quiet", "Lively"];
const CUISINE_OPTIONS = ["Traditional", "Gourmet", "Cousy"];

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Food preferences
  const [ambiancePreference, setAmbiancePreference] = useState("");
  const [pricePreference, setPricePreference] = useState("");
  const [crowdPreference, setCrowdPreference] = useState("");
  const [cuisinePreference, setCuisinePreference] = useState("");
  
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
      // Include food preferences in user registration
      await signUp(username, name, email, password, {
        ambiancePreference,
        pricePreference,
        crowdPreference,
        cuisinePreference,
      });
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
              selectedValue === option && { backgroundColor: tintColor, borderColor: tintColor }
            ]}
            onPress={() => setSelectedValue(option)}
          >
            <ThemedText 
              style={[
                styles.optionText,
                selectedValue === option && styles.selectedOptionText
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

        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

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
