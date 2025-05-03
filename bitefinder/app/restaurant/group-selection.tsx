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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

const API_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:8765"; // Standalone WebSocket server
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const SWIPE_THRESHOLD = 120;

export default function GroupSelectionScreen() {
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  // Get group data from route params
  const params = useLocalSearchParams();
  const groupCode = params.groupCode as string;

  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const matchScaleAnim = useRef(new Animated.Value(0.5)).current;
  const matchOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  const [likedRestaurantIds, setLikedRestaurantIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [matchedRestaurant, setMatchedRestaurant] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [position] = useState(new Animated.ValueXY());
  const [localMatches, setLocalMatches] = useState<string[]>([]);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toast notification state
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  // Show toast notification
  const showToast = (
    message: string,
    type: "info" | "error" = "info",
    duration = 3000
  ) => {
    setToast({
      visible: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({ visible: false, message: "", type: "info" });
    }, duration);
  };

  // Function to check for local match
  const checkForLocalMatch = (restaurant) => {
    // If restaurant already marked as match, ignore
    if (localMatches.includes(restaurant.id)) {
      return false;
    }

    if (!group || !group.members) {
      return false;
    }

    // Count members in group
    const membersCount = group.members.length;

    // If all members liked (including current like)
    if (restaurant.likes.length === membersCount && membersCount >= 2) {
      console.log(
        `LOCAL MATCH FOUND for ${restaurant.name}!`,
        restaurant.likes
      );
      return true;
    }

    return false;
  };

  // Send message via WebSocket
  const sendWsMessage = (type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type,
        data,
      });
      wsRef.current.send(message);
    } else {
      console.warn("WebSocket not connected, message not sent:", type, data);
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = (username: string, token: string) => {
    console.log("Initializing WebSocket for restaurant selection");

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Create WebSocket connection with auth token
    const ws = new WebSocket(`${WS_URL}?token=${token}&group=${groupCode}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established");
      console.log(`Connected to room: ${groupCode} as ${username}`);

      // No need to explicitly send join_group as the server handles it
      // based on URL parameters
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message, username);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);

      // Attempt to reconnect after delay unless it was intentional
      if (event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          initializeWebSocket(username, token);
        }, 3000);
      }
    };
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: any, username: string) => {
    const { type, data } = message;

    switch (type) {
      case "selection_reset":
        console.log("Selection reset by server");

        // Create a fresh copy of restaurants with empty likes
        const resetRestaurants = MOCK_RESTAURANTS.map((restaurant) => ({
          ...restaurant,
          likes: [],
        }));

        // Reset all states
        setRestaurants(resetRestaurants);
        setLikedRestaurantIds([]);
        setLocalMatches([]);
        resetMatchAnimation();
        setMatchedRestaurant(null);
        break;
      case "restaurant_match":
        console.log("Received restaurant match from server:", data);

        // If already showing a match, ignore this event
        if (matchedRestaurant) {
          console.log("Already showing a match, ignoring server match event");
          return;
        }

        // Check if already displaying this match locally
        if (localMatches.includes(data.restaurant_id)) {
          console.log("Match already detected locally, ignoring server event");
          return;
        }

        if (data && data.restaurant_id) {
          // Find restaurant in our list
          let matched = restaurants.find((r) => r.id === data.restaurant_id);

          // If not found in current list, look in original restaurants
          if (!matched) {
            matched = MOCK_RESTAURANTS.find((r) => r.id === data.restaurant_id);
          }

          if (matched) {
            // Register match to avoid duplication
            setLocalMatches((prev) => [...prev, data.restaurant_id]);

            // Trigger match animation
            setShowMatchAnimation(true);

            // Set matched restaurant after delay
            setTimeout(() => {
              setMatchedRestaurant(matched);

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
          } else {
            console.log(
              "Could not find matched restaurant in local state:",
              data.restaurant_id
            );
          }
        }
        break;
      case "restaurant_vote":
        console.log("Received restaurant vote:", data);

        if (data && data.restaurant_id && data.username) {
          // Skip processing our own votes (they're already applied)
          if (data.username === username) return;

          // Update restaurant likes based on the vote
          setRestaurants((prevRestaurants) => {
            const updatedRestaurants = [...prevRestaurants];
            const restaurantIndex = updatedRestaurants.findIndex(
              (r) => r.id === data.restaurant_id
            );

            if (restaurantIndex >= 0) {
              const restaurant = updatedRestaurants[restaurantIndex];
              const updatedRestaurant = { ...restaurant };

              if (data.liked) {
                if (!updatedRestaurant.likes.includes(data.username)) {
                  updatedRestaurant.likes = [
                    ...updatedRestaurant.likes,
                    data.username,
                  ];
                }
              } else {
                updatedRestaurant.likes = updatedRestaurant.likes.filter(
                  (name) => name !== data.username
                );
              }

              updatedRestaurants[restaurantIndex] = updatedRestaurant;

              // Check for match immediately if all members liked
              if (
                group &&
                group.members &&
                updatedRestaurant.likes.length === group.members.length &&
                updatedRestaurant.likes.length >= 2
              ) {
                console.log(`MATCH DETECTED FOR ${data.restaurant_name}!`);

                if (!localMatches.includes(data.restaurant_id)) {
                  // Register match locally
                  setLocalMatches((prev) => [...prev, data.restaurant_id]);

                  // Set the matched restaurant
                  setMatchedRestaurant(updatedRestaurant);
                  setShowMatchAnimation(true);

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
                }
              }
            }

            return updatedRestaurants;
          });
        }
        break;
      case "group_dissolved":
        console.log("Received group_dissolved event:", data);

        showToast(
          data.message || "The group has been dissolved by the host",
          "error"
        );

        // Delay navigation to allow toast to be seen
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
        break;

      case "member_left":
        if (data && data.username) {
          // Show toast about member leaving
          showToast(`${data.name || data.username} has left the group`, "info");
        }
        break;

      default:
        console.log("Unhandled WebSocket message type:", type, data);
    }
  };

  // Load user data, group info, and restaurants when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Get user data
        const userData = await AsyncStorage.getItem("userData");
        const userToken = await AsyncStorage.getItem("userToken");

        if (!userData || !userToken) {
          showToast("Please login first to continue", "error");
          router.replace("/(auth)/login");
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);

        // Get group information
        const groupResponse = await fetch(`${API_URL}/groups/${groupCode}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        if (!groupResponse.ok) {
          const errorData = await groupResponse.json();
          showToast(
            errorData.error || "Failed to get group information",
            "error"
          );
          router.back();
          return;
        }

        const groupData = await groupResponse.json();

        // Also get group members with a second call
        const membersResponse = await fetch(
          `${API_URL}/groups/${groupCode}/members`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        let membersList = [];
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          membersList = membersData.members || [];
        }

        // Add members to group object
        const groupWithMembers = {
          ...groupData.group,
          members: membersList,
        };

        setGroup(groupWithMembers);

        // For demo using mock data
        setTimeout(() => {
          setRestaurants(MOCK_RESTAURANTS);
          setIsLoading(false);
        }, 1500);

        // Initialize WebSocket connection
        initializeWebSocket(user.username, userToken);
      } catch (error) {
        console.error("Error loading data:", error);
        showToast("Failed to load selection data. Please try again.", "error");
        setIsLoading(false);
      }
    };

    loadData();

    // Clean up WebSocket connection when component unmounts
    return () => {
      if (wsRef.current) {
        // Send leave message before closing
        if (wsRef.current.readyState === WebSocket.OPEN) {
          sendWsMessage("leave_group", { group_code: groupCode });

          // Close connection gracefully
          wsRef.current.close(1000, "User left the screen");
        }
      }

      // Clear any reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [groupCode]);

  // Check for matches whenever restaurant list changes
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

  // Melhorar a função checkForMatches para ser mais robusta
  const checkForMatches = () => {
    if (!group || !restaurants.length) return;

    // Melhorar logs para depuração
    console.log("Checking for matches with group members:", group.members);
    console.log("Current user:", currentUser?.username);

    const membersCount = group.members?.length || 0;
    console.log(`Total members count: ${membersCount}`);

    if (membersCount < 2) {
      console.log("Need at least 2 members for a match");
      return; // Precisamos de pelo menos 2 membros para um match
    }

    for (const restaurant of restaurants) {
      console.log(
        `Restaurant ${restaurant.name} has ${restaurant.likes.length} likes:`,
        restaurant.likes
      );

      // Verificar se todos os membros ativos deram like
      if (
        restaurant.likes.length >= 2 &&
        restaurant.likes.length === membersCount
      ) {
        console.log(`🎯 MATCH FOUND for ${restaurant.name}!`);

        // Resto do código para exibir o match...
        setShowMatchAnimation(true);

        setTimeout(() => {
          setMatchedRestaurant(restaurant);

          // Animar...
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

          // Notificar o servidor sobre o match
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "restaurant_match",
                data: {
                  group_code: groupCode,
                  restaurant_id: restaurant.id,
                  restaurant_name: restaurant.name,
                  username: currentUser?.username,
                  name: currentUser?.name || currentUser?.username,
                },
              })
            );
          }
        }, 800);

        return;
      }
    }
  };

  // Reset animation values when exiting match screen
  const resetMatchAnimation = () => {
    matchScaleAnim.setValue(0.5);
    matchOpacityAnim.setValue(0);
    confettiOpacity.setValue(0);
    setShowMatchAnimation(false);
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

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  const swipeLeft = () => {
    if (restaurants.length === 0) return;

    const currentRestaurant = restaurants[0];

    // Emit vote to websocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "restaurant_vote",
          data: {
            group_code: groupCode,
            restaurant_id: currentRestaurant.id,
            restaurant_name: currentRestaurant.name,
            username: currentUser?.username,
            name: currentUser?.name || currentUser?.username,
            liked: false,
          },
        })
      );
    }

    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => nextCard());
  };

  const swipeRight = () => {
    if (restaurants.length === 0) return;

    const currentRestaurant = restaurants[0];

    // Add the current restaurant to liked restaurants with current user's like
    if (currentUser) {
      // Store this restaurant in a tracking array
      setLikedRestaurantIds((prev) => [...prev, currentRestaurant.id]);

      // Importante: clone o restaurante atual para evitar problemas com animações
      const updatedRestaurant = {
        ...currentRestaurant,
        likes: [...currentRestaurant.likes, currentUser.username],
      };

      // Atualizar localmente o restaurante com o like do usuário atual
      setRestaurants((prevRestaurants) => {
        const updatedRestaurants = [...prevRestaurants];
        updatedRestaurants[0] = updatedRestaurant;
        return updatedRestaurants;
      });

      // Verificação rápida de match localmente
      const localMatch = checkForLocalMatch(updatedRestaurant);

      // Se for um match, exibir imediatamente
      if (localMatch) {
        // Registrar o match localmente para evitar duplicação
        setLocalMatches((prev) => [...prev, updatedRestaurant.id]);

        // Mostrar animação de match
        setTimeout(() => {
          setMatchedRestaurant(updatedRestaurant);
          setShowMatchAnimation(true);

          // Iniciar animações
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
        }, 300);
      }

      // Send vote to server via socket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "restaurant_vote",
            data: {
              group_code: groupCode,
              restaurant_id: currentRestaurant.id,
              restaurant_name: currentRestaurant.name,
              username: currentUser?.username,
              name: currentUser?.name || currentUser?.username,
              liked: true,
            },
          })
        );
      }
    }

    // Animate the card away
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => nextCard());
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

  // Lista de restaurantes simulada - normalmente seria buscada da API
  const MOCK_RESTAURANTS = [
    {
      id: "1",
      name: "McDonald's",
      image:
        "https://lh3.googleusercontent.com/places/ANXAkqFBVnyQ-XEmZDRSBiFJDepDfttO5iRNscIP-_hCkgP9Tce3hu2KZuKTBdgn2Mcr8qgUZRK1NZ7vZqchIl0MP2YPnJVEa7x7s_M=s4800-h1200",
      cuisine: "Fast Food",
      rating: 4.0,
      priceRange: "$$",
      distance: "0.5 miles",
      likes: [],
    },
    {
      id: "2",
      name: "Restaurante Tapas nas Costas",
      image:
        "https://lh3.googleusercontent.com/place-photos/AJnk2cw-tgibn8GAqxAg1JGmEIHgkrNRcsr0QLfUsgyDPhSd0j31mHH0RlC9eHgBEzvwZvcom9ECsO6_964FL-YRzkQp-zW_piF99iy1oMfxNO0USRasAkz8l2mT-6wBfLu4g8o7jUentisNxwoXx2M=s4800-h4032",
      cuisine: "Spanish",
      rating: 4.5,
      priceRange: "$$$",
      distance: "1.2 miles",
      likes: [],
    },
    {
      id: "3",
      name: "Go Chef Coimbra",
      image:
        "https://lh3.googleusercontent.com/places/ANXAkqHAJmzFiISYYbdqoZx3cjwrf0fM_kNV85xjJo28yUxqo8sMOLRm5P7fqd_roGWNljkEJAztq1NW19H9-4kHTyyZeNXqb8jh3MY=s4800-h1200",
      cuisine: "Portuguese",
      rating: 4.4,
      priceRange: "$$$",
      distance: "1.5 miles",
      likes: [],
    },
    {
      id: "4",
      name: "Floresta cafe by Hungry biker",
      image:
        "https://lh3.googleusercontent.com/places/ANXAkqHfyZGS77HUKLKh9RIyh19O2yRpD5icp5eyJmWNxSU2GGyIXAnb30vSFLnq7FGfoy3JRlUYjK4E_yfogjtpADU0J8fRdXTyKKM=s4800-h4800",
      cuisine: "Café",
      rating: 4.8,
      priceRange: "$$$",
      distance: "0.9 miles",
      likes: [],
    },
    {
      id: "5",
      name: "Burger King Coimbra Centro",
      image:
        "https://lh3.googleusercontent.com/places/ANXAkqEhHC7cUroikCjDfplC-_5EjpMiNnBHWnkgGXNHZPtBNhMYifLRuVL7mu8dbXXD4PbzILiBDTX_SeoEGwPARpLkG6fLZs5-QDc=s4800-h4800",
      cuisine: "Fast Food",
      rating: 4.0,
      priceRange: "$$",
      distance: "0.6 miles",
      likes: [],
    },
    {
      id: "6",
      name: "Briosa Coimbra",
      image:
        "https://lh3.googleusercontent.com/place-photos/AJnk2cz5iqdEr6ljCa6EkYkx88frAA1K9TfacOdZQrF4G3hr9vaQmVoU_7SU4t2QML5LHRXHFRF3Fxs415A-L1mQRrGIY1wMIoLHHfFcCQlH6aEM_YSNPoBQvE0mef4ZENhs4P2XP2cR86Ot1IbE7g=s4800-h3600",
      cuisine: "Portuguese",
      rating: 4.2,
      priceRange: "$$",
      distance: "1.0 miles",
      likes: [],
    },
    {
      id: "7",
      name: "Dear Breakfast - Chiado",
      image:
        "https://lh3.googleusercontent.com/places/ANXAkqFsBrCcuqMGd71zH-Flf35LsRNYnlEQyNyAQS_pE7B3I7D1wuxzoKvefqgz8TD4unFAI358PGr3JjT02rCfYiZMJxHHud6ctdg=s4800-h480",
      cuisine: "Breakfast",
      rating: 4.5,
      priceRange: "$$$",
      distance: "1.8 miles",
      likes: [],
    },
    {
      id: "8",
      name: "Zenith - Brunch & Cocktails Bar",
      image:
        "https://lh3.googleusercontent.com/place-photos/AJnk2cwJcXFRzmwen7ArJnynXDRnynKoI5kuCPJwvViKvgUs-nPPR8KvSXCUbkKdiCPAewIRoN3UautNaTMCb1RWaSaFs0at73yrKiCLede-oHPjwJzX1mqald_Y5uAsJ5Qu8_uiMrPzwmLo2Af4hw=s4800-h4032",
      cuisine: "Brunch",
      rating: 4.5,
      priceRange: "$$$",
      distance: "2.1 miles",
      likes: [],
    },
    {
      id: "9",
      name: "Café Santiago",
      image:
        "https://lh3.googleusercontent.com/place-photos/AJnk2czb7-cjhF602qCMQ2e78p7uVpWAEnWkvAlFkZzCfOyMeJVOU1ZMUepzslxFxjPWIrBM2ZQfn6Re3vkw7aONNg4BSMHm24ergNJDpItdoWdZ59OKpNYuEvAnsSacwHULVJRpUvbZU7tbTB0JyA=s4800-h3060",
      cuisine: "Café",
      rating: 4.4,
      priceRange: "$$$",
      distance: "1.4 miles",
      likes: [],
    },
    {
      id: "10",
      name: "Restaurant Jardim da Manga",
      image:
        "https://lh3.googleusercontent.com/place-photos/AJnk2cyDNvjLC9kxYkh4Wu0Ad6jmts3ZR1h2SrT940i0AzQva6LEM7YuJM-So1dxu7kLNbrNf1c_3xIbBCSg4EywyyUXrRys_VfkVAQBBYIOpbkLHwjp8JhtjD4ysbXmvQDD6q6QidGKl7Cufq0qk8I=s4800-h3000",
      cuisine: "Portuguese",
      rating: 4.3,
      priceRange: "$$$",
      distance: "0.7 miles",
      likes: [],
    },
  ];

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
                Its a match!
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
              style={[
                styles.button,
                { backgroundColor: tintColor, marginTop: 30 },
              ]}
              onPress={() => {
                // Clear liked restaurant IDs
                setLikedRestaurantIds([]);

                // Clear local matches tracking
                setLocalMatches([]);

                // Create a fresh copy of the mock restaurants with empty likes arrays
                const freshRestaurants = MOCK_RESTAURANTS.map((restaurant) => ({
                  ...restaurant,
                  likes: [],
                }));

                // Set the fresh restaurants
                setRestaurants(freshRestaurants);

                // Tell the server to reset the selection for this group
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: "reset_selection",
                      data: {
                        group_code: groupCode,
                        username: currentUser?.username,
                        name: currentUser?.name || currentUser?.username,
                      },
                    })
                  );
                }
              }}
            >
              <ThemedText style={styles.buttonText}>Start Over</ThemedText>
            </TouchableOpacity>
            {/* Add Home button */}
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 15 }]}
              onPress={() => router.replace("/(tabs)")}
            >
              <ThemedView
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Ionicons
                  name="home-outline"
                  size={20}
                  color={textColor}
                  style={{ marginRight: 8 }}
                />
                <ThemedText
                  style={[styles.secondaryButtonText, { color: textColor }]}
                >
                  Return to Home
                </ThemedText>
              </ThemedView>
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
          onPress={() => {
            // Clear liked restaurant IDs
            setLikedRestaurantIds([]);

            // Clear local matches tracking
            setLocalMatches([]);

            // Create a fresh copy of the mock restaurants with empty likes arrays
            const freshRestaurants = MOCK_RESTAURANTS.map((restaurant) => ({
              ...restaurant,
              likes: [],
            }));

            // Set the fresh restaurants
            setRestaurants(freshRestaurants);
          }}
        >
          <ThemedText style={styles.buttonText}>Start Over</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Toast notification */}
      {toast.visible && (
        <View
          style={[
            styles.toastContainer,
            { backgroundColor: toast.type === "error" ? "#FF6B6B" : "#4ECDC4" },
          ]}
        >
          <Ionicons
            name={toast.type === "error" ? "alert-circle" : "checkmark-circle"}
            size={24}
            color="white"
            style={{ marginRight: 8 }}
          />
          <ThemedText style={styles.toastMessage}>{toast.message}</ThemedText>
        </View>
      )}
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
              {group.name} • {group.members?.length || 0} people
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
          Swipe right if you like, left if you dont
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

                    {/* Keep the likes container but make it invisible */}
                    {restaurant.likes.length > 0 && (
                      <ThemedView
                        style={[
                          styles.likesContainer,
                          { opacity: 0, height: 0, overflow: "hidden" },
                        ]}
                      >
                        <ThemedView style={styles.likesRow}>
                          <Ionicons
                            name="heart"
                            size={16}
                            color="#FF6B6B"
                            style={{ marginRight: 6 }}
                          />
                          <ThemedText style={styles.likesText}>
                            {restaurant.likes.length}/
                            {group.members?.length || 0} group votes
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.progressMiniBar}>
                          <ThemedView
                            style={[
                              styles.progressMiniFill,
                              {
                                width: `${
                                  (restaurant.likes.length /
                                    (group.members?.length || 1)) *
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
  toastContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    zIndex: 100,
    opacity: 0.95,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  toastMessage: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});
