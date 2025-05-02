import { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  View,
  ActivityIndicator,
  Share,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
  avatar?: string;
}

export default function ParticipantLobbyScreen() {
  const params = useLocalSearchParams();
  const groupCode = params.code as string;
  const groupName = (params.name as string) || "Dinner Group";

  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");

  const [members, setMembers] = useState<Member[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [joinError, setJoinError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load current user data and join group
  useEffect(() => {
    const loadUserAndJoinGroup = async () => {
      try {
        // Get user token and data
        const userToken = await AsyncStorage.getItem("userToken");
        const userData = await AsyncStorage.getItem("userData");

        if (!userToken || !userData) {
          Alert.alert("Not logged in", "Please login first to join a group");
          router.replace({ pathname: "/(auth)/login" });
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);

        // Join the group
        await joinGroup(groupCode, user.username, userToken);
      } catch (error) {
        console.error("Error loading user data or joining group:", error);
        setJoinError("Failed to join group. Please try again.");
        setIsJoining(false);
      }
    };

    loadUserAndJoinGroup();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      if (!isJoining && !joinError) {
        fetchGroupMembers();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [groupCode]);

  // Join the group
  const joinGroup = async (code: string, username: string, token: string) => {
    try {
      setIsJoining(true);

      // Call the API to join the group
      const response = await fetch(`${API_URL}/groups/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          username: username,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successfully joined the group
        setIsJoining(false);
        // Fetch group members
        fetchGroupMembers();
      } else {
        // Failed to join group
        setJoinError(data.error || "Failed to join group");
        Alert.alert("Error", data.error || "Failed to join group");
        setIsJoining(false);
        // Navigate back to friends tab
        setTimeout(() => {
          router.replace({ pathname: "/(tabs)/friends" });
        }, 1500);
      }
    } catch (error) {
      console.error("Error joining group:", error);
      setJoinError("Network error. Please try again.");
      setIsJoining(false);
      // Navigate back to friends tab
      setTimeout(() => {
        router.replace({ pathname: "/(tabs)/friends" });
      }, 1500);
    }
  };

  // Fetch group members
  const fetchGroupMembers = async () => {
    try {
      setIsLoading(true);
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        Alert.alert("Not logged in", "Please login first");
        router.replace({ pathname: "/(auth)/login" });
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

        // Process members data
        const processedMembers = (data.members || []).map((member: Member) => {
          let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            member.name
          )}&background=random`;

          return {
            ...member,
            avatar: avatarUrl,
          };
        });

        setMembers(processedMembers);

        // Update current user's ready status
        const currentMember = processedMembers.find(
          (m: Member) => m.username === currentUser?.username
        );
        if (currentMember) {
          setIsReady(currentMember.is_ready || false);
        }

        // Check if group selection has started
        if (data.group_status === "selecting") {
          // Navigate to restaurant selection screen
          router.replace({
            pathname: "/restaurant/group-selection",
            params: { groupCode },
          });
        }
      } else {
        const errorData = await response.json();

        // If group is inactive, return to friends page
        if (errorData.error === "Group is inactive") {
          Alert.alert(
            "Group Inactive",
            "The host has left the group. The group is now inactive.",
            [
              {
                text: "OK",
                onPress: () => router.replace({ pathname: "/(tabs)/friends" }),
              },
            ]
          );
          return;
        }

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

  // Toggle ready status
  const toggleReadyStatus = async () => {
    try {
      setUpdatingStatus(true);
      const userToken = await AsyncStorage.getItem("userToken");

      // Call API to update ready status
      const response = await fetch(`${API_URL}/groups/${groupCode}/ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          username: currentUser.username,
          is_ready: !isReady,
        }),
      });

      if (response.ok) {
        // Update local state
        setIsReady(!isReady);

        // Update the user's status in the members list
        setMembers(
          members.map((member) => {
            if (member.username === currentUser?.username) {
              return {
                ...member,
                is_ready: !isReady,
              };
            }
            return member;
          })
        );
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating ready status:", error);
      Alert.alert("Error", "Failed to update ready status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Navigate back to friends tab
  const navigateToFriends = () => {
    router.replace("/(tabs)/friends");
  };

  // Leave the group
  const leaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this dinner group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              const userToken = await AsyncStorage.getItem("userToken");

              if (!userToken) {
                navigateToFriends();
                return;
              }

              // Call API to leave group
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
                navigateToFriends();
              } else {
                const errorData = await response.json();
                Alert.alert(
                  "Error",
                  errorData.error || "Failed to leave group"
                );
                navigateToFriends();
              }
            } catch (error) {
              console.error("Error leaving group:", error);
              Alert.alert("Error", "Failed to leave group. Please try again.");
              navigateToFriends();
            }
          },
        },
      ]
    );
  };

  // Show loading screen while joining group
  if (isJoining) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={tintColor}
          style={styles.loadingIndicator}
        />
        <ThemedText style={styles.loadingText}>Joining group...</ThemedText>
      </ThemedView>
    );
  }

  // Show error screen if joining failed
  if (joinError) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
        <ThemedText style={[styles.loadingText, { color: "#FF6B6B" }]}>
          {joinError}
        </ThemedText>
        <ThemedText style={styles.subErrorText}>
          Returning to friends page...
        </ThemedText>
      </ThemedView>
    );
  }

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

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: tintColor }]}
            onPress={async () => {
              try {
                await Share.share({
                  message: `Join my restaurant picking group in BiteFinder! Group code: ${groupCode}`,
                });
              } catch (error) {
                Alert.alert("Error", "Could not share group code");
              }
            }}
          >
            <Ionicons name="share-outline" size={20} color="white" />
            <ThemedText style={styles.shareButtonText}>Share</ThemedText>
          </TouchableOpacity>
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
          disabled={updatingStatus}
        >
          {updatingStatus ? (
            <View style={styles.updatingContainer}>
              <ActivityIndicator color="white" size="small" />
              <ThemedText style={styles.readyButtonText}>
                Updating...
              </ThemedText>
            </View>
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
        <View style={styles.membersHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Group Members ({members.length})
          </ThemedText>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchGroupMembers}
          >
            <Ionicons name="refresh-outline" size={20} color={textColor} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingMembersContainer}>
            <ActivityIndicator color={tintColor} />
            <ThemedText style={styles.loadingMembersText}>
              Loading members...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.username}
            renderItem={({ item }) => (
              <ThemedView
                style={[styles.memberCard, { backgroundColor: cardColor }]}
              >
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      {
                        backgroundColor: item.is_host
                          ? "#4ECDC4"
                          : item.is_ready
                          ? "#4CAF50"
                          : "#FFC107",
                      },
                    ]}
                  >
                    <ThemedText style={styles.avatarInitial}>
                      {item.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                )}

                <ThemedView style={styles.memberInfo}>
                  <ThemedText style={styles.memberName}>
                    {item.name}
                    {item.username === currentUser?.username ? " (You)" : ""}
                    {item.is_host && " • Host"}
                  </ThemedText>

                  <ThemedView
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: item.is_host
                          ? "#4ECDC4"
                          : item.is_ready
                          ? "#4CAF50"
                          : "#FFC107",
                      },
                    ]}
                  >
                    <ThemedText style={styles.statusText}>
                      {item.is_host
                        ? "Host"
                        : item.is_ready
                        ? "Ready"
                        : "Waiting"}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            )}
            contentContainerStyle={styles.membersList}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                No members found. Try refreshing the list.
              </ThemedText>
            }
          />
        )}
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
  // ...existing styles...
  updatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // ...rest of existing styles...
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  subErrorText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
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
    gap: 10,
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
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "600",
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
    marginLeft: 5,
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
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
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
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
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
  loadingMembersContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingMembersText: {
    marginTop: 10,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    fontStyle: "italic",
    opacity: 0.7,
  },
});
