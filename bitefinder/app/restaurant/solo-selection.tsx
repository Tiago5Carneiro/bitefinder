import { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  View,
  ScrollView,
  Dimensions,
  Linking,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

// Get screen dimensions
const { width } = Dimensions.get("window");
const cardWidth = width - 32;

export default function SoloSelectionScreen() {
  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = "http://localhost:5000";

  // Helper function to convert price level to $ symbols
  const formatPriceLevel = (priceLevel: number | string) => {
    if (priceLevel === "price_level" || priceLevel === 0)
      return "Price not available";
    if (typeof priceLevel === "number") {
      return "$".repeat(priceLevel);
    }
    return priceLevel;
  };

  useEffect(() => {
    const loadRestaurants = async () => {
      setIsLoading(true);
      try {
        const userData = await AsyncStorage.getItem("userData");
        const userToken = await AsyncStorage.getItem("userToken");

        if (userData && userToken) {
          const user = JSON.parse(userData);
          setCurrentUser(user);

          // Fetch restaurants for this user
          const response = await fetch(
            `${API_URL}/restaurants/${user.username}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const validRestaurants = data.restaurants.filter(
              (r: any) => r.restaurant_name !== "name"
            );
            setRestaurants(validRestaurants);
          } else {
            console.error("Failed to fetch restaurants:", response.status);
          }
        }
      } catch (error) {
        console.error("Error loading restaurants:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  const openMapLocation = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Error opening map location:", err)
    );
  };

  // Fixed back button handler
  const handleBack = () => {
    router.replace("/(tabs)");
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Improved header with better back button */}
      <ThemedView style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>Suggestions</ThemedText>
        <View style={styles.placeholder} />
      </ThemedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ThemedView style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>
              Finding the perfect places for you...
            </ThemedText>
          </ThemedView>
        ) : restaurants.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <Ionicons
              name="restaurant-outline"
              size={64}
              color={textColor}
              style={{ opacity: 0.5 }}
            />
            <ThemedText style={styles.emptyText}>
              No restaurants found. Try adjusting your preferences.
            </ThemedText>
          </ThemedView>
        ) : (
          restaurants.map((restaurant, index) => (
            <ThemedView
              key={restaurant.url || index}
              style={[
                styles.restaurantCard,
                { backgroundColor: cardBackground },
              ]}
            >
              <Image
                source={{
                  uri:
                    restaurant.images && restaurant.images.length > 0
                      ? restaurant.images[0]
                      : "https://via.placeholder.com/500x300?text=No+Image",
                }}
                style={styles.restaurantImage}
              />

              {/* Enhanced rating badge */}
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <ThemedText style={styles.ratingText}>
                  {typeof restaurant.rating === "number"
                    ? restaurant.rating.toFixed(1)
                    : "N/A"}
                </ThemedText>
              </View>

              <ThemedView style={styles.cardContent}>
                <ThemedText style={styles.restaurantName}>
                  {restaurant.restaurant_name}
                </ThemedText>

                <ThemedView style={styles.detailsRow}>
                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.priceText}>
                      {formatPriceLevel(restaurant.price_level)}
                    </ThemedText>

                    {restaurant.price_range && (
                      <ThemedText style={styles.priceRangeText}>
                        {restaurant.price_range}
                      </ThemedText>
                    )}
                  </View>
                </ThemedView>

                {restaurant.summary ? (
                  <ThemedText style={styles.descriptionText} numberOfLines={3}>
                    {restaurant.summary}
                  </ThemedText>
                ) : (
                  <ThemedText
                    style={[
                      styles.descriptionText,
                      { fontStyle: "italic", opacity: 0.6 },
                    ]}
                  >
                    No description available
                  </ThemedText>
                )}

                <TouchableOpacity
                  style={[styles.mapButton, { backgroundColor: tintColor }]}
                  onPress={() =>
                    restaurant.url && openMapLocation(restaurant.url)
                  }
                >
                  <Ionicons name="location" size={18} color="white" />
                  <ThemedText style={styles.mapButtonText}>
                    View in Maps
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 4,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  placeholder: {
    width: 70,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    opacity: 0.7,
  },
  restaurantCard: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  restaurantImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ratingText: {
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 4,
    color: "black",
  },
  cardContent: {
    padding: 18,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  priceText: {
    fontSize: 15,
    opacity: 0.8,
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priceRangeText: {
    fontSize: 14,
    opacity: 0.7,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  mapButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 6,
  },
});
