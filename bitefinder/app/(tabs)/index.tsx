import { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

const { width, height } = Dimensions.get("window");

export default function DiningOptionsScreen() {
  const tintColor = useThemeColor({}, "tint");
  const secondaryColor = useThemeColor({}, "secondary");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");

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

  const handleOptionSelection = (option: "solo" | "date" | "group") => {
    let pathname: "/restaurant/solo-selection" | "/restaurant/group-selection";

    if (option === "date") {
      pathname = "/restaurant/group-selection";
    } else if (option === "group") {
      pathname = "/restaurant/group-selection";
    } else {
      pathname = "/restaurant/solo-selection";
    }

    router.push({ pathname });
  };

  return (
    <ThemedView style={styles.container}>
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
});
