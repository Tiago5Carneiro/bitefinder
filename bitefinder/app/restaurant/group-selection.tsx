import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  Alert,
  StatusBar,
  Easing,
  View,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const SWIPE_THRESHOLD = 120;

// Lista de restaurantes simulada
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
    likes: [], // IDs dos usuários que deram like
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
    likes: [],
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
    likes: [],
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
    likes: [],
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
    likes: [],
  },
];

// Simular um grupo de usuários
const MOCK_GROUP = {
  id: "grupo123",
  members: ["user1", "user2", "user3"], // 3 usuários no grupo
  name: "Lunch Squad",
};

export default function GroupSelectionScreen() {
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const matchScaleAnim = useRef(new Animated.Value(0.5)).current;
  const matchOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  const [likedRestaurantIds, setLikedRestaurantIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const [restaurants, setRestaurants] = useState<
    {
      id: string;
      name: string;
      image: string;
      cuisine: string;
      rating: number;
      priceRange: string;
      distance: string;
      likes: string[];
    }[]
  >([]);
  const [matchedRestaurant, setMatchedRestaurant] = useState<{
    id: string;
    name: string;
    image: string;
    cuisine: string;
    rating: number;
    priceRange: string;
    distance: string;
    likes: string[];
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState("user1"); // Usuário atual simulado
  const [group, setGroup] = useState(MOCK_GROUP);
  const [position] = useState(new Animated.ValueXY());

  // Configurar dados iniciais
  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setRestaurants(MOCK_RESTAURANTS);
      setIsLoading(false);
    }, 1500);
  }, []);

  // Verificar matches sempre que a lista de restaurantes mudar
  useEffect(() => {
    checkForMatches();
  }, [restaurants]);

  const toggleCardExpansion = (restaurantId: string) => {
    if (expandedCardId === restaurantId) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(restaurantId);
    }
  };

  // Verificar se algum restaurante tem likes de todos os membros do grupo
  const checkForMatches = () => {
    for (const restaurant of restaurants) {
      if (restaurant.likes.length === group.members.length) {
        // Instead of immediately setting matchedRestaurant, trigger animation sequence
        setShowMatchAnimation(true);

        // Set the matched restaurant after a slight delay
        setTimeout(() => {
          setMatchedRestaurant(restaurant);

          // Start animations
          Animated.parallel([
            Animated.timing(matchScaleAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.elastic(1.2),
              useNativeDriver: true,
            }),
            Animated.timing(matchOpacityAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(300),
              Animated.timing(confettiOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }, 800); // Delay before showing match screen

        return;
      }
    }
  };
  // New function to process group votes on a specific restaurant
  interface Restaurant {
    id: string;
    name: string;
    image: string;
    cuisine: string;
    rating: number;
    priceRange: string;
    distance: string;
    likes: string[];
  }

  const processGroupVotesForRestaurant = (restaurant: Restaurant): void => {
    // Create a copy of the restaurant to work with
    const restaurantWithVotes: Restaurant = { ...restaurant };
    const currentLikes: string[] = [...restaurantWithVotes.likes];

    // For each group member (except current user), simulate vote
    group.members.forEach((memberId: string) => {
      if (memberId !== currentUserId) {
        // 60% chance to like
        if (Math.random() < 0.6 && !currentLikes.includes(memberId)) {
          currentLikes.push(memberId);
          console.log(`User ${memberId} liked restaurant ${restaurant.id}`);
        }
      }
    });

    // Update the restaurant with new likes
    restaurantWithVotes.likes = currentLikes;

    // Check if all group members liked this restaurant
    // Check if all group members liked this restaurant
    if (currentLikes.length === group.members.length) {
      console.log("Match found! All group members liked the restaurant!");

      // Trigger the animation sequence
      setShowMatchAnimation(true);

      // Set matched restaurant after delay
      setTimeout(() => {
        setMatchedRestaurant(restaurantWithVotes);

        // Start animations
        Animated.parallel([
          Animated.timing(matchScaleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.elastic(1.2),
            useNativeDriver: true,
          }),
          Animated.timing(matchOpacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(confettiOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, 800);
    }
  };
  // Configuração do PanResponder para os gestos de swipe
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        swipeRight();
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        swipeLeft();
      } else {
        resetPosition();
      }
    },
  });

  // Reset animation values when exiting match screen
  const resetMatchAnimation = () => {
    matchScaleAnim.setValue(0.5);
    matchOpacityAnim.setValue(0);
    confettiOpacity.setValue(0);
    setShowMatchAnimation(false);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => nextCard());
  };

  const swipeRight = () => {
    if (restaurants.length === 0) {
      return;
    }

    const currentRestaurant = restaurants[0];
    console.log(
      `User ${currentUserId} is liking restaurant ${currentRestaurant.id}`
    );

    // Add the current restaurant to liked restaurants with current user's like
    const updatedRestaurant = {
      ...currentRestaurant,
      likes: [...currentRestaurant.likes, currentUserId],
    };

    // Store this restaurant in a tracking array
    setLikedRestaurantIds((prev) => [...prev, currentRestaurant.id]);

    // Process votes from group members for this restaurant
    processGroupVotesForRestaurant(updatedRestaurant);

    // Animate the card away
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => nextCard());
  };

  // Simular votos de outros usuários no lugar, sem usar setState
  const simulateOtherUsersVotesInPlace = (
    restaurants: {
      id: string;
      name: string;
      image: string;
      cuisine: string;
      rating: number;
      priceRange: string;
      distance: string;
      likes: string[];
    }[],
    targetIndex: number
  ) => {
    // Se não existir restaurantes ou o índice for inválido, não faz nada
    if (!restaurants || !restaurants[targetIndex]) {
      console.log("Invalid restaurants or target index");
      return;
    }

    const targetRestaurant = restaurants[targetIndex];
    console.log(
      `Simulating votes for restaurant ${targetRestaurant.id} in-place`
    );

    // Clonar o restaurante e seus likes para modificação
    const updatedRestaurant = { ...targetRestaurant };
    const updatedLikes = [...(updatedRestaurant.likes || [])];

    console.log("Current likes before simulation:", updatedLikes);

    // Para cada membro do grupo (exceto o usuário atual)
    group.members.forEach((memberId) => {
      // Não simular para o usuário atual
      if (memberId !== currentUserId) {
        // Aumentando a probabilidade para 80% para garantir mais matches
        if (Math.random() < 0.3) {
          console.log(
            `User ${memberId} liked restaurant ${targetRestaurant.id}`
          );

          // Se este membro ainda não deu like
          if (!updatedLikes.includes(memberId)) {
            console.log(`Adding like for user ${memberId}`);
            updatedLikes.push(memberId);
          }
        }
      }
    });

    console.log("Updated likes after simulation:", updatedLikes);

    // Atualizar o restaurante com os novos likes
    updatedRestaurant.likes = updatedLikes;
    restaurants[targetIndex] = updatedRestaurant;

    // Verificar se temos um match após a simulação
    if (updatedLikes.length === group.members.length) {
      console.log("MATCH FOUND in simulation!");

      // Atualizar o state com o match
      setMatchedRestaurant(updatedRestaurant);
    }

    // Atualizar o state com os novos likes
    setRestaurants([...restaurants]);
  };

  const nextCard = () => {
    setRestaurants((prevRestaurants) => prevRestaurants.slice(1));
    position.setValue({ x: 0, y: 0 });
  };

  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: rotation },
    ],
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const shareGroupCode = () => {
    Alert.alert(
      "Share Group Code",
      `Share this code with your friends: ${group.id}`,
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.loadingText}>
          Setting up group voting...
        </ThemedText>
      </ThemedView>
    );
  }

  if (matchedRestaurant) {
    return (
      <ThemedView style={styles.matchContainer}>
        <StatusBar barStyle="light-content" />
        <Image
          source={{ uri: matchedRestaurant.image }}
          style={styles.matchBackgroundImage}
          blurRadius={15}
        />
        <ThemedView style={styles.matchOverlay}>
          {/* Confetti effect */}
          <Animated.View
            style={[styles.confettiContainer, { opacity: confettiOpacity }]}
          >
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.confettiPiece,
                  {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 50}%`,
                    backgroundColor: [
                      "#FFD700",
                      "#FF6B6B",
                      "#4ECDC4",
                      "#7C4DFF",
                      "#FF9800",
                    ][Math.floor(Math.random() * 5)],
                    transform: [
                      { rotate: `${Math.random() * 360}deg` },
                      { scale: Math.random() * 0.5 + 0.5 },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>

          <Animated.View
            style={[
              styles.matchContent,
              {
                transform: [{ scale: matchScaleAnim }],
                opacity: matchOpacityAnim,
              },
            ]}
          >
            <ThemedView style={styles.matchBadge}>
              <Ionicons name="checkmark-circle" size={28} color="#4ECDC4" />
              <ThemedText type="title" style={styles.matchTitle}>
                It's a match!
              </ThemedText>
            </ThemedView>

            <ThemedText style={styles.matchSubtitle}>
              Everyone in your group liked this restaurant
            </ThemedText>

            <ThemedView style={styles.matchImageContainer}>
              <Image
                source={{ uri: matchedRestaurant.image }}
                style={styles.matchImage}
              />
              <ThemedView style={styles.matchBanner}>
                <Ionicons name="people" size={16} color="#fff" />
                <ThemedText style={styles.matchBannerText}>
                  Group Match
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.matchInfoCard}>
              <ThemedText type="title" style={styles.restaurantName}>
                {matchedRestaurant.name}
              </ThemedText>

              <ThemedView style={styles.matchDetailRow}>
                <Ionicons
                  name="restaurant-outline"
                  size={18}
                  color={textColor}
                />
                <ThemedText style={styles.restaurantDetails}>
                  {matchedRestaurant.cuisine}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.matchDetailRow}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <ThemedText style={styles.restaurantDetails}>
                  {matchedRestaurant.rating} rating
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.matchDetailRow}>
                <Ionicons name="cash-outline" size={18} color={textColor} />
                <ThemedText style={styles.restaurantDetails}>
                  {matchedRestaurant.priceRange} price range
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.matchDetailRow}>
                <Ionicons name="location-outline" size={18} color={textColor} />
                <ThemedText style={styles.restaurantDetails}>
                  {matchedRestaurant.distance} away
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={() =>
                Alert.alert(
                  "Restaurant Details",
                  "View restaurant details here."
                )
              }
            >
              <ThemedText style={styles.buttonText}>View Details</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                resetMatchAnimation();
                setMatchedRestaurant(null);
                setRestaurants(MOCK_RESTAURANTS);
              }}
            >
              <ThemedText
                style={[styles.secondaryButtonText, { color: textColor }]}
              >
                Start New Selection
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </ThemedView>
      </ThemedView>
    );
  }

  if (showMatchAnimation && !matchedRestaurant) {
    return (
      <ThemedView style={styles.matchLoadingContainer}>
        <StatusBar barStyle="light-content" />
        <ThemedView style={styles.matchLoadingContent}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [
                  {
                    scale: position.x.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [1, 1.2],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="restaurant" size={36} color="#fff" />
          </Animated.View>
          <ThemedText style={styles.matchLoadingText}>Match found!</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (restaurants.length === 0) {
    return (
      <ThemedView style={styles.noMoreCards}>
        <StatusBar barStyle="light-content" />
        <Ionicons
          name="search"
          size={80}
          color={tintColor}
          style={{ opacity: 0.5 }}
        />
        <ThemedText style={styles.noMoreCardsText}>
          No more restaurants to show
        </ThemedText>
        <ThemedText style={styles.waitingText}>
          Waiting for your group to finish...
        </ThemedText>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor, marginTop: 30 }]}
          onPress={() => setRestaurants(MOCK_RESTAURANTS)}
        >
          <ThemedText style={styles.buttonText}>Start Over</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ThemedView style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>

        <ThemedView style={styles.headerContent}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Group Decision
          </ThemedText>
          <ThemedView style={styles.groupInfo}>
            <Ionicons
              name="people"
              size={16}
              color={textColor}
              style={{ marginRight: 6 }}
            />
            <ThemedText style={styles.groupInfoText}>
              {group.name} • {group.members.length} people
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <TouchableOpacity onPress={shareGroupCode} style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={24} color={tintColor} />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.progressContainer}>
        <ThemedView style={styles.progressBar}>
          <ThemedView
            style={[
              styles.progressFill,
              {
                width: `${
                  100 - (restaurants.length / MOCK_RESTAURANTS.length) * 100
                }%`,
                backgroundColor: tintColor,
              },
            ]}
          />
        </ThemedView>
        <ThemedText style={styles.progressText}>
          {MOCK_RESTAURANTS.length - restaurants.length}/
          {MOCK_RESTAURANTS.length} restaurants reviewed
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.instructions}>
        <ThemedText style={styles.instructionsText}>
          Swipe right if you like, left if you don't
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.cardContainer}>
        {restaurants.map((restaurant, index) => {
          if (index === 0) {
            const isExpanded = expandedCardId === restaurant.id;

            return (
              <Animated.View
                key={restaurant.id}
                style={[
                  styles.card,
                  cardStyle,
                  isExpanded && { height: SCREEN_HEIGHT * 0.75 },
                ]}
                {...panResponder.panHandlers}
              >
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ flexGrow: 1 }}
                  showsVerticalScrollIndicator={false}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => toggleCardExpansion(restaurant.id)}
                  >
                    <Image
                      source={{ uri: restaurant.image }}
                      style={styles.cardImage}
                    />
                    {/* Image overlay hint */}
                    <ThemedView style={styles.imageOverlay}>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="white"
                      />
                      <ThemedText style={styles.imageOverlayText}>
                        {isExpanded ? "Show less" : "Tap for details"}
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>

                  <Animated.View
                    style={[styles.likeContainer, { opacity: likeOpacity }]}
                  >
                    <ThemedText style={styles.likeText}>LIKE</ThemedText>
                  </Animated.View>

                  <Animated.View
                    style={[styles.nopeContainer, { opacity: nopeOpacity }]}
                  >
                    <ThemedText style={styles.nopeText}>NOPE</ThemedText>
                  </Animated.View>

                  <ThemedView style={styles.cardInfo}>
                    <ThemedView style={styles.cardHeader}>
                      <ThemedText type="title" style={styles.restaurantName}>
                        {restaurant.name}
                      </ThemedText>
                      <ThemedView style={styles.ratingBadge}>
                        <Ionicons name="star" size={16} color="#fff" />
                        <ThemedText style={styles.ratingText}>
                          {restaurant.rating}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>

                    <ThemedView style={styles.detailsContainer}>
                      <ThemedView style={styles.detailItem}>
                        <Ionicons
                          name="restaurant-outline"
                          size={16}
                          color={textColor}
                          style={styles.detailIcon}
                        />
                        <ThemedText>{restaurant.cuisine}</ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.detailItem}>
                        <Ionicons
                          name="cash-outline"
                          size={16}
                          color={textColor}
                          style={styles.detailIcon}
                        />
                        <ThemedText>{restaurant.priceRange}</ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.detailItem}>
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color={textColor}
                          style={styles.detailIcon}
                        />
                        <ThemedText>{restaurant.distance}</ThemedText>
                      </ThemedView>
                    </ThemedView>

                    {restaurant.likes.length > 0 && (
                      <ThemedView style={styles.likesContainer}>
                        <ThemedView style={styles.likesRow}>
                          <Ionicons
                            name="heart"
                            size={16}
                            color="#FF6B6B"
                            style={{ marginRight: 6 }}
                          />
                          <ThemedText style={styles.likesText}>
                            {restaurant.likes.length}/{group.members.length}{" "}
                            group votes
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.progressMiniBar}>
                          <ThemedView
                            style={[
                              styles.progressMiniFill,
                              {
                                width: `${
                                  (restaurant.likes.length /
                                    group.members.length) *
                                  100
                                }%`,
                                backgroundColor: "#FF6B6B",
                              },
                            ]}
                          />
                        </ThemedView>
                      </ThemedView>
                    )}

                    {/* Extended content */}
                    {isExpanded && (
                      <ThemedView style={styles.expandedContent}>
                        <ThemedView style={styles.divider} />

                        <ThemedText style={styles.sectionTitle}>
                          Open Hours
                        </ThemedText>
                        <ThemedView style={styles.hoursContainer}>
                          <ThemedView style={styles.hourRow}>
                            <ThemedText style={styles.dayText}>
                              Mon-Fri
                            </ThemedText>
                            <ThemedText style={styles.timeText}>
                              11:00 AM - 10:00 PM
                            </ThemedText>
                          </ThemedView>
                          <ThemedView style={styles.hourRow}>
                            <ThemedText style={styles.dayText}>
                              Sat-Sun
                            </ThemedText>
                            <ThemedText style={styles.timeText}>
                              10:00 AM - 11:00 PM
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>

                        <ThemedText style={styles.sectionTitle}>
                          Popular Dishes
                        </ThemedText>
                        <ThemedView style={styles.dishesContainer}>
                          {["Signature Pasta", "Garlic Bread", "Tiramisu"].map(
                            (dish, i) => (
                              <ThemedView key={i} style={styles.dishItem}>
                                <Ionicons
                                  name="restaurant"
                                  size={14}
                                  color={textColor}
                                  style={{ marginRight: 6, opacity: 0.6 }}
                                />
                                <ThemedText style={styles.dishText}>
                                  {dish}
                                </ThemedText>
                              </ThemedView>
                            )
                          )}
                        </ThemedView>

                        <ThemedText style={styles.sectionTitle}>
                          Additional Info
                        </ThemedText>
                        <ThemedView style={styles.additionalInfoContainer}>
                          <ThemedView style={styles.infoItem}>
                            <Ionicons
                              name="wifi"
                              size={16}
                              color={textColor}
                              style={{ marginRight: 8, opacity: 0.7 }}
                            />
                            <ThemedText>Free WiFi</ThemedText>
                          </ThemedView>
                          <ThemedView style={styles.infoItem}>
                            <Ionicons
                              name="card"
                              size={16}
                              color={textColor}
                              style={{ marginRight: 8, opacity: 0.7 }}
                            />
                            <ThemedText>Accepts Credit Cards</ThemedText>
                          </ThemedView>
                          <ThemedView style={styles.infoItem}>
                            <Ionicons
                              name="car"
                              size={16}
                              color={textColor}
                              style={{ marginRight: 8, opacity: 0.7 }}
                            />
                            <ThemedText>Parking Available</ThemedText>
                          </ThemedView>
                        </ThemedView>
                      </ThemedView>
                    )}
                  </ThemedView>
                </ScrollView>
              </Animated.View>
            );
          }

          // Background card (next in stack)
          if (index === 1) {
            return (
              <Animated.View
                key={restaurant.id}
                style={[styles.card, styles.backgroundCard]}
              >
                <Image
                  source={{ uri: restaurant.image }}
                  style={styles.cardImage}
                />
                <ThemedView style={styles.cardInfo}>
                  <ThemedText type="title" style={styles.restaurantName}>
                    {restaurant.name}
                  </ThemedText>
                </ThemedView>
              </Animated.View>
            );
          }

          return null;
        })}
      </ThemedView>

      <ThemedView style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.roundButton, styles.dislikeButton]}
          onPress={swipeLeft}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roundButton, styles.likeButton]}
          onPress={swipeRight}
        >
          <Ionicons name="heart" size={30} color="#fff" />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlayText: {
    color: "white",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  expandedContent: {
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  hoursContainer: {
    marginBottom: 16,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dayText: {
    fontSize: 14,
    opacity: 0.7,
  },
  timeText: {
    fontSize: 14,
  },
  dishesContainer: {
    marginBottom: 16,
  },
  dishItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dishText: {
    fontSize: 14,
  },
  additionalInfoContainer: {
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  // Update the cardImage style
  cardImage: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.3,
  },

  // Update existing card style to handle overflow
  card: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: "white",
  },
  cardInfo: {
    padding: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 15,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },

  expandButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 10,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
  },
  groupInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  groupInfoText: {
    fontSize: 14,
    opacity: 0.8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(200, 200, 200, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "right",
    opacity: 0.7,
  },
  instructions: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: "center",
  },
  instructionsText: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.8,
    fontWeight: "500",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  backgroundCard: {
    top: 10,
    zIndex: -1,
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    backgroundColor: "#4ECDC4",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  ratingText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
    opacity: 0.7,
  },
  likesContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  likesText: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressMiniBar: {
    height: 4,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressMiniFill: {
    height: "100%",
    borderRadius: 2,
  },
  likeContainer: {
    position: "absolute",
    top: 40,
    right: 30,
    transform: [{ rotate: "20deg" }],
    borderWidth: 4,
    borderColor: "#4ECDC4",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(78, 205, 196, 0.2)",
  },
  likeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4ECDC4",
  },
  nopeContainer: {
    position: "absolute",
    top: 40,
    left: 30,
    transform: [{ rotate: "-20deg" }],
    borderWidth: 4,
    borderColor: "#FF6B6B",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
  },
  nopeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 25,
    paddingHorizontal: 30,
  },
  roundButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  likeButton: {
    backgroundColor: "#4ECDC4",
  },
  dislikeButton: {
    backgroundColor: "#FF6B6B",
  },
  matchContainer: {
    flex: 1,
  },
  matchBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  matchOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  matchContent: {
    width: "100%",
    alignItems: "center",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  matchTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  matchSubtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    color: "#fff",
    opacity: 0.8,
  },
  matchImageContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 25,
    position: "relative",
  },
  matchImage: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 20,
  },
  matchBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(78, 205, 196, 0.85)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  matchBannerText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  matchInfoCard: {
    width: "100%",
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  confettiPiece: {
    position: "absolute",
    width: 10,
    height: 25,
    borderRadius: 5,
  },
  matchLoadingContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  matchLoadingContent: {
    alignItems: "center",
  },
  pulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  matchLoadingText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  matchDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  restaurantDetails: {
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  noMoreCards: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  noMoreCardsText: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  waitingText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
});
