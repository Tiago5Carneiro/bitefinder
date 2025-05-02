import { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  View,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

const { width, height } = Dimensions.get("window");
const API_URL = "http://localhost:5000"; // Update this to your API URL

export default function DiningOptionsScreen() {
  const tintColor = useThemeColor({}, "tint");
  const secondaryColor = useThemeColor({}, "secondary");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Creating your group..."
  );

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleOptionSelection = async (option: "solo" | "date" | "group") => {
    if (option === "solo") {
      router.push({ pathname: "/restaurant/solo-selection" });
    } else if (option === "date") {
      try {
        // Set loading state
        setIsLoading(true);
        setLoadingMessage("Creating your date session...");

        // Get the user token and data from AsyncStorage
        const userToken = await AsyncStorage.getItem("userToken");
        const userData = await AsyncStorage.getItem("userData");

        if (!userToken || !userData) {
          setIsLoading(false);
          Alert.alert(
            "Not logged in",
            "Please login first to create a date session"
          );
          router.push({ pathname: "/(auth)/login" });
          return;
        }

        const user = JSON.parse(userData);
        setLoadingMessage(`Setting up a date session for ${user.name}...`);

        // Create a new group with date type (max 2 people)
        const response = await fetch(`${API_URL}/groups/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            name: "Romantic Evening",
            username: user.username,
            type: "date", // Add a type parameter to indicate this is a date group
            max_members: 2, // Limit to 2 participants
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store the group code in state or AsyncStorage if needed
          await AsyncStorage.setItem("currentDateCode", data.code);
          setLoadingMessage("Date session created! Redirecting to lobby...");

          // Slight delay for better UX
          setTimeout(() => {
            setIsLoading(false);

            // Navigate to the date lobby with the group code
            router.push({
              pathname: "/restaurant/date-lobby",
              params: {
                dateCode: data.code,
                dateName: data.name,
              },
            });
          }, 800);
        } else {
          setIsLoading(false);
          Alert.alert("Error", data.error || "Failed to create date session");
        }
      } catch (error) {
        setIsLoading(false);
        console.error("Error creating date session:", error);
        Alert.alert(
          "Error",
          "Failed to create date session. Please try again."
        );
      }
    } else if (option === "group") {
      try {
        // Set loading state
        setIsLoading(true);
        setLoadingMessage("Creating your group...");

        // Get the user token and data from AsyncStorage
        const userToken = await AsyncStorage.getItem("userToken");
        const userData = await AsyncStorage.getItem("userData");

        if (!userToken || !userData) {
          setIsLoading(false);
          Alert.alert("Not logged in", "Please login first to create a group");
          router.push({ pathname: "/(auth)/login" });
          return;
        }

        const user = JSON.parse(userData);
        setLoadingMessage(`Setting up a group for ${user.name}...`);

        // Create a new group
        console.log(user);
        const response = await fetch(`${API_URL}/groups/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            name: `${user.name}'s Group`,
            username: user.username,
            type: "group", // Standard group type
            max_members: 10, // Default max members for regular groups
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store the group code in state or AsyncStorage if needed
          await AsyncStorage.setItem("currentGroupCode", data.code);
          setLoadingMessage("Group created! Redirecting to lobby...");

          // Slight delay for better UX
          setTimeout(() => {
            setIsLoading(false);

            // Navigate to the group lobby with the group code
            router.push({
              pathname: "/restaurant/group-lobby",
              params: { groupCode: data.code, groupName: data.name },
            });
          }, 800);
        } else {
          setIsLoading(false);
          Alert.alert("Error", data.error || "Failed to create group");
        }
      } catch (error) {
        setIsLoading(false);
        console.error("Error creating group:", error);
        Alert.alert("Error", "Failed to create group. Please try again.");
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Loading Modal */}
      <Modal
        transparent={true}
        visible={isLoading}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.loadingContainer, { backgroundColor }]}>
            {/* You can use ActivityIndicator or replace with Lottie animation */}
            <ActivityIndicator
              size="large"
              color={tintColor}
              style={styles.loadingIndicator}
            />
            <ThemedText style={styles.loadingText}>{loadingMessage}</ThemedText>
          </View>
        </View>
      </Modal>

      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Bite into something amazing today
        </ThemedText>
      </ThemedView>

      <Animated.View
        style={[
          styles.optionsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleOptionSelection("solo")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[tintColor, `${tintColor}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionGradient}
          />
          <View style={styles.optionContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="person" size={32} color="white" />
            </View>
            <ThemedText style={styles.optionTitle}>Just Me</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Find the perfect spot just for yourself
            </ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleOptionSelection("date")}
          activeOpacity={0.9}
          disabled={isLoading}
        >
          <LinearGradient
            colors={["#FF6B9D", "#FF8F6B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionGradient}
          />
          <View style={styles.optionContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart" size={32} color="white" />
            </View>
            <ThemedText style={styles.optionTitle}>Date Night</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Romantic places for two
            </ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleOptionSelection("group")}
          activeOpacity={0.9}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[secondaryColor, `${secondaryColor}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionGradient}
          />
          <View style={styles.optionContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={32} color="white" />
            </View>
            <ThemedText style={styles.optionTitle}>With Friends</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Find places for your group to enjoy
            </ThemedText>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  optionsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  optionCard: {
    width: width * 0.85,
    height: 120,
    borderRadius: 24,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  optionGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  optionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    position: "absolute",
    left: 104,
    top: 70,
  },
  // Loading modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    width: width * 0.8,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingIndicator: {
    marginBottom: 16,
    height: 48,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
});
