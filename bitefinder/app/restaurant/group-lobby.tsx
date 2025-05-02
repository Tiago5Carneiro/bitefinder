import { useState, useEffect, useRef } from "react";
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
import { io, Socket } from "socket.io-client"; // Import Socket.io client

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
  const [isLeaving, setIsLeaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [allReady, setAllReady] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

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
            const isUserHost = data.group.creator_username === user.username;
            setIsHost(isUserHost);

            // If user is host, automatically set them as ready
            if (isUserHost && !isReady) {
              setIsReady(true);
              updateHostReadyStatus(true);
            }

            // Only initialize socket after we have user data
            initializeSocket(user.username);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
    fetchGroupMembers();

    // Clean up function
    return () => {
      if (socketRef.current) {
        // Explicitly leave room before disconnecting
        socketRef.current.emit("leave_group", { group_code: groupCode });
        socketRef.current.disconnect();
      }
    };
  }, [groupCode]);

  // Add new function to update host's ready status
  const updateHostReadyStatus = async (ready: boolean) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");

      await fetch(`${API_URL}/groups/${groupCode}/ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          username: currentUser.username,
          is_ready: ready,
        }),
      });
    } catch (error) {
      console.error("Error updating host ready status:", error);
    }
  };

  // Update members effect to count ready members
  useEffect(() => {
    if (members.length > 0) {
      // Filter out the host from the count
      const regularMembers = members.filter((m) => !m.is_host);
      const readyRegularMembers = regularMembers.filter(
        (m) => m.is_ready
      ).length;

      setReadyCount(readyRegularMembers);

      // Check if all non-host members are ready
      setAllReady(
        readyRegularMembers === regularMembers.length &&
          regularMembers.length > 0
      );
    }
  }, [members]);

  // New function to initialize socket with username
  const initializeSocket = (username) => {
    // Initialize Socket.io connection
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      // Join the room with username included
      socket.emit("join_group", {
        group_code: groupCode,
        username: username,
      });
      console.log(`Joined room: ${groupCode} as ${username}`);
    });

    // Handler for members update
    socket.on("members_update", (data) => {
      console.log("Received members update:", data);

      // Verify we have a members array
      if (data && Array.isArray(data.members)) {
        // Transform arrays to objects if needed
        const formattedMembers = data.members
          .map((member) => {
            // Check if it's an array or already an object
            if (Array.isArray(member)) {
              // If array, assume order: [username, name, is_ready, is_host]
              return {
                username: member[0] || "",
                name: member[1] || "",
                is_ready: Boolean(member[2]),
                is_host: Boolean(member[3]),
              };
            } else if (typeof member === "object" && member !== null) {
              // If already an object, use directly
              return member;
            }
            return null;
          })
          .filter((member) => member !== null);

        console.log("Formatted members:", formattedMembers);

        // Update state with formatted members
        setMembers(formattedMembers);

        // Check if all non-host members are ready
        const regularMembers = formattedMembers.filter((m) => !m.is_host);
        const allRegularMembersReady = regularMembers.every((m) => m.is_ready);
        setAllReady(allRegularMembersReady && regularMembers.length > 0);

        // Update current user's status
        if (currentUser?.username) {
          const currentMember = formattedMembers.find(
            (m) => m.username === currentUser.username
          );
          if (currentMember) {
            setIsReady(currentMember.is_ready);
          }
        }
      } else {
        console.error("Invalid members data format:", data);
      }
    });

    // Add handler for user_joined event
    socket.on("user_joined", (data) => {
      if (data && data.username) {
        // Show toast notification about the new user
        setToast({
          visible: true,
          message:
            data.message ||
            `${data.name || data.username} has joined the group`,
          type: "info",
        });

        // Toast will auto-dismiss after a few seconds
        setTimeout(() => {
          setToast({ visible: false, message: "", type: "info" });
        }, 3000);
      }
    });
  };
  // Update useEffect for currentUser dependency
  useEffect(() => {
    if (currentUser && members.length > 0) {
      // Update current user's ready status whenever members or currentUser changes
      const currentMember = members.find(
        (m) => m.username === currentUser.username
      );
      if (currentMember) {
        setIsReady(currentMember.is_ready || false);
      }
    }
  }, [currentUser, members]);

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

        // Update current user's ready status
        if (currentUser) {
          const currentMember = data.members.find(
            (m: Member) => m.username === currentUser.username
          );
          if (currentMember) {
            setIsReady(currentMember.is_ready || false);
          }
        }
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

  // Toggle ready status for host
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
        // Local state update is no longer needed as we'll receive the update via WebSocket
        // but we'll update it anyway for immediate feedback
        setIsReady(!isReady);
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
    // Check if all non-host members are ready
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

  // Modified leaveGroup function without Alert
  const leaveGroup = async () => {
    try {
      setIsLeaving(true);
      setLeaveError("");
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        router.replace("/(tabs)");
        return;
      }

      // Call API to leave/dissolve group
      const response = await fetch(`${API_URL}/groups/${groupCode}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          username: currentUser.username,
          is_host: isHost,
        }),
      });

      if (response.ok) {
        // Navigate back to home
        router.replace("/(tabs)");
      } else {
        const errorData = await response.json();
        setLeaveError(errorData.error || "Failed to leave group");
        setTimeout(() => setLeaveError(""), 5000); // Clear error after 5 seconds
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      setLeaveError("Network error. Failed to leave group.");
      setTimeout(() => setLeaveError(""), 5000); // Clear error after 5 seconds
    } finally {
      setIsLeaving(false);
    }
  };

  // Add listener for WebSocket events
  useEffect(() => {
    if (socketRef.current) {
      // Handle group_dissolved event
      socketRef.current.on("group_dissolved", (data) => {
        if (!isHost) {
          // Show a toast notification
          setToast({
            visible: true,
            message: data.message || "The group has been dissolved by the host",
            type: "info",
          });

          // Delay navigation to allow toast to be seen
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 1500);
        }
      });

      // Handle member_left event
      socketRef.current.on("member_left", (data) => {
        if (data && data.username) {
          // Show toast notification about the member leaving
          setToast({
            visible: true,
            message:
              data.message ||
              `${data.name || data.username} has left the group`,
            type: "info",
          });

          // Toast will auto-dismiss after a few seconds
          setTimeout(() => {
            setToast({ visible: false, message: "", type: "info" });
          }, 3000);
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("group_dissolved");
        socketRef.current.off("member_left");
        socketRef.current.off("user_joined");
      }
    };
  }, [isHost, router]);
  // Update renderMemberItem to safely handle undefined members
  const renderMemberItem = ({ item }: { item: Member }) => {
    // Add safety check for null or undefined item
    if (!item || !item.name) {
      return null; // Skip rendering this item if name is missing
    }

    // Get count of members excluding the host
    const regularMembers = members.filter((m) => !m.is_host);
    const readyRegularMembers = regularMembers.filter((m) => m.is_ready).length;

    return (
      <View
        style={[styles.memberItem, { borderBottomColor: cardColor + "30" }]}
      >
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
                backgroundColor: item.is_host
                  ? allReady
                    ? "#4CAF50"
                    : "#FFC107"
                  : item.is_ready
                  ? "#4CAF50"
                  : "#FFC107",
              },
            ]}
          >
            <ThemedText style={styles.statusText}>
              {item.is_host
                ? allReady
                  ? "All Ready"
                  : `${readyRegularMembers}/${regularMembers.length} Ready`
                : item.is_ready
                ? "Ready"
                : "Waiting"}
            </ThemedText>
          </ThemedView>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Toast notification */}
      {toast.visible && (
        <View
          style={[
            styles.toastContainer,
            { backgroundColor: toast.type === "error" ? "#FF6B6B" : "#4ECDC4" },
          ]}
        >
          <ThemedText style={styles.toastMessage}>{toast.message}</ThemedText>
        </View>
      )}
      {/* Show leave error if any */}
      {leaveError ? (
        <View style={styles.errorBanner}>
          <ThemedText style={styles.errorText}>{leaveError}</ThemedText>
        </View>
      ) : null}

      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Group Lobby
        </ThemedText>

        <TouchableOpacity
          onPress={leaveGroup}
          style={styles.leaveButton}
          disabled={isLeaving}
        >
          {isLeaving ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Ionicons name="exit-outline" size={24} color="#FF6B6B" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.codeContainer}>
        <ThemedText style={styles.codeLabel}>
          Share this code with others:
        </ThemedText>
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
            ? "Wait for everyone to join, then start when all members are ready."
            : "Wait for the host to start the restaurant selection when everyone is ready."}
        </ThemedText>
      </View>

      {/* Status Box - Modified for host */}
      <ThemedView style={[styles.statusBox, { backgroundColor: cardColor }]}>
        <ThemedText style={styles.statusBoxTitle}>Your Status</ThemedText>

        {!isHost ? (
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
        ) : (
          <ThemedView
            style={[
              styles.hostStatusBanner,
              { backgroundColor: allReady ? "#4CAF50" : "#FFC107" },
            ]}
          >
            <Ionicons
              name={allReady ? "checkmark-circle" : "people-outline"}
              size={24}
              color="#fff"
              style={styles.readyIcon}
            />
            <ThemedText style={styles.hostStatusText}>
              {allReady
                ? "Everyone is Ready!"
                : `Waiting - ${readyCount}/${
                    members.filter((m) => !m.is_host).length
                  } Ready`}
            </ThemedText>
          </ThemedView>
        )}

        {isHost && (
          <ThemedText style={styles.hostNote}>
            As the host, you don't need to get ready. You can start the
            selection once all other members are ready.
          </ThemedText>
        )}
      </ThemedView>

      <View style={styles.membersContainer}>
        <View style={styles.membersHeader}>
          <ThemedText style={styles.membersTitle}>Members</ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.loadingMembersContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.loadingText}>
              Loading members...
            </ThemedText>
          </View>
        ) : members.length === 0 ? (
          <ThemedText style={styles.emptyText}>
            No members joined yet.
          </ThemedText>
        ) : (
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.username}
            style={styles.membersList}
          />
        )}
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
              : `Waiting for members (${readyCount}/${
                  members.filter((m) => !m.is_host).length
                } Ready)`}
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Style additions for new components

  toastContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    zIndex: 100,
    opacity: 0.95,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toastMessage: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
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
  hostNote: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: "center",
  },
  updatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  loadingMembersContainer: {
    padding: 20,
    alignItems: "center",
  },
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
  hostStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 16,
    width: "80%",
  },
  hostStatusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  errorBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FF6B6B",
    padding: 10,
    zIndex: 100,
  },
  errorText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
});
