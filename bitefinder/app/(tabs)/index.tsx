import { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

// Exemplos de frases para inspiração
const EXAMPLE_PHRASES = [
  "A cozy place with warm lighting and comfort food",
  "Somewhere vibrant with music and energetic atmosphere",
  "Quiet café with tasty pastries and good coffee",
  "Elegant restaurant for a special date night",
  "Casual spot where I can work while eating",
];

const { width } = Dimensions.get("window");

export default function MoodSelectionScreen() {
  const { mode } = useLocalSearchParams();
  const tintColor = useThemeColor({}, "tint");
  const secondaryColor = useThemeColor({}, "secondary");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");

  const [userDescription, setUserDescription] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
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

  // Continuar para a próxima tela
  const handleContinue = () => {
    // Show the mode selection modal
    setShowModeModal(true);
  };

  // Handle mode selection and navigate
  const handleModeSelection = (selectedMode: "solo" | "group") => {
    setShowModeModal(false);

    if (selectedMode === "group") {
      router.push({
        pathname: "/restaurant/group-selection",
        params: { description: userDescription },
      });
    } else {
      router.push({
        pathname: "/restaurant/solo-selection",
        params: { description: userDescription },
      });
    }
  };

  // Usar uma frase de exemplo
  const useExamplePhrase = (phrase: string) => {
    setUserDescription(phrase);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Find Your Ideal Spot
          </ThemedText>

          <ThemedView style={styles.placeholder} />
        </ThemedView>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <ThemedText style={styles.instructionText}>
              Tell us what kind of dining experience you're looking for today
            </ThemedText>

            <ThemedView
              style={[
                styles.inputContainer,
                isInputFocused && {
                  borderColor: tintColor,
                  shadowColor: tintColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 6,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={userDescription}
                onChangeText={setUserDescription}
                placeholder="Describe your ideal dining experience..."
                placeholderTextColor="rgba(150, 150, 150, 0.8)"
                multiline
                numberOfLines={4}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </ThemedView>

            <ThemedText style={styles.examplesTitle}>
              Need inspiration? Tap one of these:
            </ThemedText>

            <ThemedView style={styles.examplesContainer}>
              {EXAMPLE_PHRASES.map((phrase, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.exampleItem,
                    { backgroundColor: `${cardColor}80` },
                  ]}
                  onPress={() => useExamplePhrase(phrase)}
                >
                  <ThemedText style={styles.exampleText}>"{phrase}"</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </Animated.View>
        </ScrollView>

        <ThemedView style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              userDescription.trim().length > 0
                ? { opacity: 1 }
                : { opacity: 0.6 },
            ]}
            onPress={handleContinue}
            disabled={userDescription.trim().length === 0}
          >
            <LinearGradient
              colors={
                userDescription.trim().length > 0
                  ? [tintColor, secondaryColor]
                  : ["#cccccc", "#999999"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <ThemedText style={styles.continueButtonText}>
                Find Restaurants
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </ThemedView>

        {/* Mode Selection Modal */}
        <Modal
          visible={showModeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowModeModal(false)}
        >
          <ThemedView style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                { backgroundColor: cardColor },
                {
                  opacity: fadeAnim,
                  transform: [{ scale: fadeAnim }],
                },
              ]}
            >
              <ThemedText style={styles.modalTitle}>
                How are you dining today?
              </ThemedText>

              <TouchableOpacity
                style={styles.modalButtonContainer}
                onPress={() => handleModeSelection("solo")}
              >
                <LinearGradient
                  colors={[tintColor, `${tintColor}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalButton}
                >
                  <ThemedText style={styles.modalButtonText}>
                    Just Me
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonContainer}
                onPress={() => handleModeSelection("group")}
              >
                <LinearGradient
                  colors={[secondaryColor, `${secondaryColor}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalButton}
                >
                  <ThemedText style={styles.modalButtonText}>
                    With Friends
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModeModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </ThemedView>
        </Modal>
      </ThemedView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 10,
  },
  instructionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
    opacity: 0.85,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: "rgba(150, 150, 150, 0.3)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  examplesTitle: {
    fontSize: 18,
    marginBottom: 18,
    fontWeight: "500",
  },
  examplesContainer: {
    marginBottom: 20,
  },
  exampleItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  exampleText: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    width: width * 0.85,
    padding: 28,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 28,
    textAlign: "center",
  },
  modalButtonContainer: {
    width: "100%",
    height: 60,
    marginBottom: 16,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
