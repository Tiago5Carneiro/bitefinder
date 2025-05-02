import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Share,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

const API_URL = "http://localhost:5000";

interface Member {
  username: string;
  name: string;
  is_ready?: boolean;
  is_host?: boolean;
}

export default function GroupLobbyScreen() {
  const { groupCode, groupName } = useLocalSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [allReady, setAllReady] = useState(false);

  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUser(user);

          // Check if current user is the host (creator of the group)
          const response = await fetch(`${API_URL}/groups/${groupCode}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${await AsyncStorage.getItem(
                "userToken"
              )}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setIsHost(data.group.creator_username === user.username);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
    fetchGroupMembers();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchGroupMembers();
    }, 5000);

    return () => clearInterval(interval);
  }, [groupCode]);

  const fetchGroupMembers = async () => {
    try {
      setIsLoading(true);
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        Alert.alert("Not logged in", "Please login first");
        router.push({ pathname: "/(auth)/login" });
        return;
      }

      const response = await fetch(`${API_URL}/groups/${groupCode}/members`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);

        // Check if all members are ready
        const allMembersReady = data.members.every(
          (member: Member) => member.is_ready
        );
        setAllReady(allMembersReady && data.members.length > 0);
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.error || "Failed to fetch group members"
        );
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
      Alert.alert("Error", "Failed to fetch group members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const shareGroupCode = async () => {
    try {
      await Share.share({
        message: `Join my restaurant picking group in BiteFinder! Group code: ${groupCode}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share group code");
    }
  };

  const startRestaurantPicking = async () => {
    // Check if all members are ready
    if (!allReady) {
      Alert.alert(
        "Not everyone is ready",
        "Please wait until all members have marked themselves as ready."
      );
      return;
    }

    try {
      // Update group status to "selecting" in the API
      const userToken = await AsyncStorage.getItem("userToken");
      const response = await fetch(`${API_URL}/groups/${groupCode}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        // Navigate to restaurant selection screen
        router.push({
          pathname: "/restaurant/group-selection",
          params: { groupCode },
        });
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to start selection");
      }
    } catch (error) {
      console.error("Error starting selection:", error);
      Alert.alert(
        "Error",
        "Failed to start restaurant selection. Please try again."
      );
    }
  };

  const leaveGroup = () => {
    Alert.alert(
      isHost ? "Dissolve Group" : "Leave Group",
      isHost
        ? "As the host, leaving will dissolve the group for all members. Are you sure?"
        : "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isHost ? "Dissolve Group" : "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              const userToken = await AsyncStorage.getItem("userToken");

              if (!userToken) {
                router.replace({ pathname: "/(tabs)" });
                return;
              }

              // Call API to leave/dissolve group
              const response = await fetch(
                `${API_URL}/groups/${groupCode}/leave`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`,
                  },
                  body: JSON.stringify({
                    username: currentUser.username,
                  }),
                }
              );

              if (response.ok) {
                // Navigate back to home
                router.replace({ pathname: "/(tabs)" });
              } else {
                const errorData = await response.json();
                Alert.alert(
                  "Error",
                  errorData.error || "Failed to leave group"
                );
              }
            } catch (error) {
              console.error("Error leaving group:", error);
              Alert.alert("Error", "Failed to leave group. Please try again.");
              router.replace({ pathname: "/(tabs)" });
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <View style={[styles.memberItem, { borderBottomColor: cardColor + "30" }]}>
      <View
        style={[
          styles.memberAvatar,
          {
            backgroundColor: item.is_host
              ? "#4ECDC4"
              : item.is_ready
              ? "#4CAF50"
              : "#FFC107",
          },
        ]}
      >
        <ThemedText style={styles.memberInitial}>
          {item.name.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.memberInfoContainer}>
        <ThemedText style={styles.memberName}>
          {item.name}
          {currentUser && item.username === currentUser.username && " (You)"}
          {item.is_host && " • Host"}
        </ThemedText>

        <ThemedView
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.is_ready ? "#4CAF50" : "#FFC107",
            },
          ]}
        >
          <ThemedText style={styles.statusText}>
            {item.is_ready ? "Ready" : "Waiting"}
          </ThemedText>
        </ThemedView>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Group Lobby
        </ThemedText>

        <TouchableOpacity onPress={leaveGroup} style={styles.leaveButton}>
          <Ionicons name="exit-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <View style={styles.codeContainer}>
        <ThemedText style={styles.codeLabel}>Group Code:</ThemedText>
        <ThemedText style={styles.codeText}>{groupCode}</ThemedText>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: tintColor }]}
          onPress={shareGroupCode}
        >
          <Ionicons name="share-outline" size={20} color="white" />
          <ThemedText style={styles.shareButtonText}>Share Code</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <ThemedText style={styles.infoText}>
          {isHost
            ? "You're the host! Share this code with friends to let them join your group."
            : "Share this code with friends to let them join your group!"}
        </ThemedText>

        {isHost && (
          <ThemedText style={[styles.infoText, styles.hostNote]}>
            As the host, you can start the restaurant selection once everyone is
            ready.
          </ThemedText>
        )}
      </View>

      <View style={styles.membersContainer}>
        <ThemedText style={styles.membersTitle}>
          Members ({members.length})
        </ThemedText>

        {isLoading ? (
          <View style={styles.loadingMembersContainer}>
            <ActivityIndicator color={tintColor} />
            <ThemedText style={styles.loadingText}>
              Loading members...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.username}
            style={styles.membersList}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>No members yet</ThemedText>
            }
          />
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchGroupMembers}
        >
          <Ionicons name="refresh" size={20} color={textColor} />
          <ThemedText style={styles.refreshText}>Refresh Members</ThemedText>
        </TouchableOpacity>
      </View>

      {isHost && (
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor: allReady ? tintColor : cardColor,
              opacity: allReady ? 1 : 0.5,
            },
          ]}
          onPress={startRestaurantPicking}
          disabled={!allReady}
        >
          <ThemedText
            style={[
              styles.startButtonText,
              { color: allReady ? "white" : textColor },
            ]}
          >
            {allReady
              ? "Start Picking Restaurants"
              : "Waiting for all members to be ready..."}
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginRight: 0, // Changed to center correctly
  },
  leaveButton: {
    padding: 10,
  },
  codeContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  codeLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  codeText: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 5,
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  shareButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "600",
  },
  infoContainer: {
    marginTop: 10,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  infoText: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  hostNote: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.8,
  },
  membersContainer: {
    marginTop: 20,
    flex: 1,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberInfoContainer: {
    flex: 1,
    marginLeft: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
  },
  loadingMembersContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    fontStyle: "italic",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    padding: 10,
  },
  refreshText: {
    marginLeft: 5,
    fontSize: 14,
  },
  startButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
