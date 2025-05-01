import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  // Make sure this is export default
  const { user, signOut } = useAuth();
  const tintColor = useThemeColor({}, "tint");

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Profile
      </ThemedText>

      <ThemedView style={styles.infoContainer}>
        <ThemedText type="subtitle">Name</ThemedText>
        <ThemedText style={styles.infoText}>{user?.name || "N/A"}</ThemedText>

        <ThemedText type="subtitle" style={styles.label}>
          Email
        </ThemedText>
        <ThemedText style={styles.infoText}>{user?.email || "N/A"}</ThemedText>
      </ThemedView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: tintColor }]}
        onPress={signOut}
      >
        <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
});
