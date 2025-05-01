import { StyleSheet, TouchableOpacity, TextInput, Alert, Modal, View } from "react-native";
import { useState } from "react";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  // Authentication and user context
  const { user, signOut } = useAuth();
  
  // Theme colors
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const modalBackgroundColor = useThemeColor({}, "background");
  
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Handle profile update
  const handleSave = async () => {
    try {
      // Here you would update the user profile in your backend
      // await updateUserProfile({ name, email });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // Cancel profile edit
  const handleCancel = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setIsEditing(false);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Profile Header */}
      <ThemedText type="title" style={styles.title}>
        Profile
      </ThemedText>

      {/* Profile Information Container */}
      <ThemedView style={styles.infoContainer}>
        {/* User Name Section */}
        <ThemedText type="subtitle">Name</ThemedText>
        <ThemedText style={styles.infoText}>{user?.name || "N/A"}</ThemedText>

        {/* User Email Section */}
        <ThemedText type="subtitle" style={styles.label}>
          Email
        </ThemedText>
        <ThemedText style={styles.infoText}>{user?.email || "N/A"}</ThemedText>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={[styles.editProfileButton, { borderColor: tintColor }]}
          onPress={() => setIsEditing(true)}
        >
          <ThemedText style={[styles.editProfileButtonText, { color: tintColor }]}>
            Edit Profile
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: tintColor }]}
        onPress={signOut}
      >
        <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
      </TouchableOpacity>

      {/* Profile Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditing}
        onRequestClose={() => setIsEditing(false)}
      >
        {/* Modal Background Overlay */}
        <View style={styles.modalOverlay}>
          {/* Modal Content Container */}
          <View style={[styles.modalContent, { backgroundColor: modalBackgroundColor }]}>
            {/* Modal Title */}
            <ThemedText type="title" style={styles.modalTitle}>
              Edit Profile
            </ThemedText>
            
            {/* Modal: Name Label */}
            <ThemedText type="subtitle">Name</ThemedText>
            {/* Modal: Name Input Field */}
            <TextInput
              style={[styles.input, { backgroundColor, color: tintColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />

            {/* Modal: Email Label */}
            <ThemedText type="subtitle" style={styles.label}>
              Email
            </ThemedText>
            {/* Modal: Email Input Field */}
            <TextInput
              style={[styles.input, { backgroundColor, color: tintColor }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
            />

            {/* Modal: Action Buttons Container */}
            <ThemedView style={styles.editButtonsContainer}>
              {/* Modal: Save Button */}
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: tintColor }]}
                onPress={handleSave}
              >
                <ThemedText style={styles.buttonText}>Save</ThemedText>
              </TouchableOpacity>
              {/* Modal: Cancel Button */}
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: "gray" }]}
                onPress={handleCancel}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// Styles
const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginTop: 60,
    marginBottom: 30,
    textAlign: "center",
  },
  infoContainer: {
    marginBottom: 30,
  },
  label: {
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    marginTop: 5,
  },
  
  // Button styles
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  editProfileButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  
  // Form styles
  input: {
    height: 50,
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  editButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  editButton: {
    flex: 0.48,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
