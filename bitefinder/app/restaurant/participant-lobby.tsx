import { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

// Mock user data - will be replaced with real data from the server
const MOCK_USERS = [
  {
    id: "user1",
    name: "Alex Johnson (Host)",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    status: "host",
  },
  {
    id: "user2",
    name: "You",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
    status: "pending", // will change to ready when user is ready
  },
  {
    id: "user3",
    name: "Sam Rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    status: "ready",
  },
];

export default function ParticipantLobbyScreen() {
  const params = useLocalSearchParams();
  const groupCode = params.code as string;
  const groupName = (params.name as string) || "Dinner Group";

  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");

  const [members, setMembers] = useState(MOCK_USERS);
  const [isReady, setIsReady] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  // Find the current user and update their status
  const toggleReadyStatus = () => {
    setIsReady(!isReady);

    // Update the user's status in the members list
    setMembers(
      members.map((member) => {
        if (member.id === "user2") {
          // "You" is hardcoded as user2 in our mock data
          return {
            ...member,
            status: isReady ? "pending" : "ready",
          };
        }
        return member;
      })
    );

    // Send ready status to server (simulated)
    setIsWaiting(true);
    setTimeout(() => {
      setIsWaiting(false);
    }, 500);
  };

  // Navigate back to friends tab
  const navigateToFriends = () => {
    router.navigate("/(tabs)/friends");
  };

  // Leave the group with confirmation
  const leaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this dinner group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            // Simulate leaving group on the server
            setTimeout(() => {
              // Navigate back to friends tab after successfully leaving
              navigateToFriends();
            }, 300);
          },
        },
      ]
    );
  };

  // Effect to simulate a host starting the selection
  useEffect(() => {
    const timer = setTimeout(() => {
      // This would normally be triggered by a websocket event from the server
      // when the host starts the selection process
      if (Math.random() > 0.7 && isReady) {
        router.push("/restaurant/group-selection");
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isReady]);

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={navigateToFriends} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>

        <ThemedView style={styles.headerContent}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {groupName}
          </ThemedText>
        </ThemedView>

        <TouchableOpacity onPress={leaveGroup} style={styles.leaveButton}>
          <Ionicons name="exit-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </ThemedView>

      {/* Group Info Card */}
      <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
        <ThemedText type="title" style={styles.groupName}>
          {groupName}
        </ThemedText>

        <ThemedView style={styles.codeContainer}>
          <ThemedView style={styles.codeBox}>
            <ThemedText style={styles.codeText}>{groupCode}</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedText style={styles.statusMessage}>
          {isReady
            ? "You're ready! Waiting for the host to start..."
            : "Please mark yourself as ready when you're prepared to choose restaurants"}
        </ThemedText>
      </ThemedView>

      {/* Status Box */}
      <ThemedView style={[styles.statusBox, { backgroundColor: cardColor }]}>
        <ThemedText style={styles.statusBoxTitle}>Your Status</ThemedText>

        <TouchableOpacity
          style={[
            styles.readyButton,
            { backgroundColor: isReady ? "#4CAF50" : "#FFC107" },
          ]}
          onPress={toggleReadyStatus}
          disabled={isWaiting}
        >
          {isWaiting ? (
            <ThemedText style={styles.readyButtonText}>Updating...</ThemedText>
          ) : (
            <>
              <Ionicons
                name={isReady ? "checkmark-circle" : "time-outline"}
                size={20}
                color="#fff"
                style={styles.readyIcon}
              />
              <ThemedText style={styles.readyButtonText}>
                {isReady ? "I'm Ready" : "Mark as Ready"}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        <ThemedText style={styles.waitingText}>
          The host will start the restaurant selection when everyone is ready
        </ThemedText>
      </ThemedView>

      {/* Members List */}
      <ThemedView style={styles.membersSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Group Members ({members.length})
        </ThemedText>

        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemedView
              style={[styles.memberCard, { backgroundColor: cardColor }]}
            >
              <Image
                source={{ uri: item.avatar }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />

              <ThemedView style={styles.memberInfo}>
                <ThemedText style={styles.memberName}>{item.name}</ThemedText>

                <ThemedView
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === "host"
                          ? "#4ECDC4"
                          : item.status === "ready"
                          ? "#4CAF50"
                          : "#FFC107",
                    },
                  ]}
                >
                  <ThemedText style={styles.statusText}>
                    {item.status === "host"
                      ? "Host"
                      : item.status === "ready"
                      ? "Ready"
                      : "Waiting"}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          )}
          contentContainerStyle={styles.membersList}
        />
      </ThemedView>

      {/* Leave Button at bottom */}
      <ThemedView style={styles.actionButtons}>
        <TouchableOpacity style={styles.leaveGroupButton} onPress={leaveGroup}>
          <Ionicons
            name="exit-outline"
            size={20}
            color="#FF6B6B"
            style={styles.buttonIcon}
          />
          <ThemedText style={[styles.leaveButtonText, { color: "#FF6B6B" }]}>
            Leave Group
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
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
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  leaveButton: {
    padding: 8,
    borderRadius: 20,
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: "rgba(78, 205, 196, 0.1)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 1,
  },
  statusMessage: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 20,
  },
  statusBox: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  statusBoxTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },
  readyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 16,
    width: "80%",
  },
  readyIcon: {
    marginRight: 8,
  },
  readyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  waitingText: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: "center",
  },
  membersSection: {
    paddingHorizontal: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  membersList: {
    paddingBottom: 20,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  actionButtons: {
    padding: 16,
  },
  leaveGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  buttonIcon: {
    marginRight: 8,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
