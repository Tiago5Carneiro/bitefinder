import { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  View,
  ScrollView,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

// Get screen dimensions
const { width } = Dimensions.get("window");
const cardWidth = width - 32; // Card width with margins

// Mock data para restaurantes
const MOCK_RESTAURANTS = [
  {
    id: "1",
    name: "Sushi Paradise",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    cuisine: "Japanese",
    rating: 4.5,
    priceRange: "$$",
    distance: "0.8 miles",
    description: "A cozy place with delicate flavors and calm atmosphere.",
    ambiance: "Calm",
  },
  {
    id: "2",
    name: "Burger Joint",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    cuisine: "American",
    rating: 4.2,
    priceRange: "$",
    distance: "1.2 miles",
    description: "Vibrant spot with great music and energetic crowds.",
    ambiance: "Energetic",
  },
  {
    id: "3",
    name: "Pasta Palace",
    image:
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    cuisine: "Italian",
    rating: 4.7,
    priceRange: "$$$",
    distance: "2.1 miles",
    description: "Elegant restaurant with romantic atmosphere and fine wines.",
    ambiance: "Romantic",
  },
  {
    id: "4",
    name: "Taco Fiesta",
    image:
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    cuisine: "Mexican",
    rating: 4.1,
    priceRange: "$",
    distance: "0.6 miles",
    description:
      "Casual Mexican spot with lively music and colorful decorations.",
    ambiance: "Lively",
  },
  {
    id: "5",
    name: "Golden Dragon",
    image:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    cuisine: "Chinese",
    rating: 4.3,
    priceRange: "$$",
    distance: "1.5 miles",
    description:
      "Authentic dishes in a comfortable setting with warm lighting.",
    ambiance: "Comfortable",
  },
];

export default function SoloSelectionScreen() {
  const { description } = useLocalSearchParams();
  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "card");

  const [restaurants, setRestaurants] = useState(MOCK_RESTAURANTS);
  const [filteredText, setFilteredText] = useState("");

  useEffect(() => {
    if (description) {
      console.log("User description:", description);
      setFilteredText(description.toString());

      // Aqui você implementaria a lógica real de filtragem baseada na descrição
      // Por enquanto, apenas simularemos que os restaurantes foram filtrados

      // A lógica de filtragem real poderia usar:
      // 1. Análise de sentimento
      // 2. Matching de palavras-chave
      // 3. Integração com API de IA para processar a linguagem natural

      // Simular a filtragem por enquanto (não mudamos de fato os dados)
      setRestaurants([...MOCK_RESTAURANTS]);
    }
  }, [description]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle">Restaurant Suggestions</ThemedText>

        <View style={styles.placeholder} />
      </ThemedView>

      {filteredText ? (
        <ThemedView style={styles.filterInfo}>
          <ThemedText style={styles.filterText}>
            Showing restaurants based on:
          </ThemedText>
          <ThemedText style={styles.filterDescription}>
            "{filteredText}"
          </ThemedText>
        </ThemedView>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {restaurants.map((restaurant) => (
          <TouchableOpacity
            key={restaurant.id}
            style={[styles.restaurantCard, { backgroundColor: cardBackground }]}
            onPress={() => {
              // Navegar para detalhes do restaurante
              alert(`Selected: ${restaurant.name}`);
            }}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: restaurant.image }}
              style={styles.restaurantImage}
            />

            <View style={styles.ratingBadge}>
              <ThemedText style={styles.ratingText}>
                {restaurant.rating}
              </ThemedText>
            </View>

            <ThemedView style={styles.cardContent}>
              <ThemedText type="title" style={styles.restaurantName}>
                {restaurant.name}
              </ThemedText>

              <ThemedView style={styles.detailsRow}>
                <ThemedText style={styles.cuisineText}>
                  {restaurant.cuisine}
                </ThemedText>
                <ThemedText style={styles.priceText}>
                  {restaurant.priceRange}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.detailsRow}>
                <ThemedView style={styles.ambianceTag}>
                  <ThemedText style={styles.ambianceText}>
                    {restaurant.ambiance}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.distanceText}>
                  {restaurant.distance}
                </ThemedText>
              </ThemedView>

              <ThemedText style={styles.descriptionText} numberOfLines={2}>
                {restaurant.description}
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
        ))}
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
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
  },
  placeholder: {
    width: 50,
  },
  filterInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 8,
  },
  filterText: {
    fontSize: 14,
    opacity: 0.7,
  },
  filterDescription: {
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  restaurantCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  restaurantImage: {
    width: "100%",
    height: 160,
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 20,
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cuisineText: {
    fontSize: 14,
    opacity: 0.8,
  },
  priceText: {
    fontSize: 14,
    opacity: 0.8,
  },
  ambianceTag: {
    backgroundColor: "rgba(78, 205, 196, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ambianceText: {
    fontSize: 12,
  },
  distanceText: {
    fontSize: 14,
    opacity: 0.7,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    marginTop: 4,
  },
});
