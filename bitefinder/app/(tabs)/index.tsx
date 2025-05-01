import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, Modal } from "react-native";
import { router } from "expo-router";
import { useState } from "react";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function HomeScreen() {
  const tintColor = useThemeColor({}, "tint");
  const [modalVisible, setModalVisible] = useState(false);

  const handleFindRestaurant = () => {
    setModalVisible(true);
  };

  const handleDiningChoice = (isGroup: boolean) => {
    setModalVisible(false);
    if (isGroup) {
      router.push("/restaurant/group-selection");
    } else {
      router.push("/restaurant/solo-selection");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require("@/assets/images/partial-react-logo.png")}
        style={styles.logo}
      />

      <ThemedView style={styles.contentContainer}>
        <ThemedText type="title" style={styles.title}>
          BiteFinder️
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Find your perfect dining experience
        </ThemedText>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={handleFindRestaurant}
        >
          <ThemedText style={styles.buttonText}>Find a Restaurant</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              How are you dining today?
            </ThemedText>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: tintColor }]}
              onPress={() => handleDiningChoice(false)}
            >
              <ThemedText style={styles.buttonText}>Dining Solo</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: tintColor }]}
              onPress={() => handleDiningChoice(true)}
            >
              <ThemedText style={styles.buttonText}>
                Dining with a Group
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    width: "100%",
    height: 200,
    marginTop: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    width: "80%",
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    width: "100%",
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
  },
  cancelText: {
    fontSize: 16,
  },
});
