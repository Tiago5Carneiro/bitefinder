import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  View,
  TextInput,
  Clipboard,
  Share,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client"; // Import Socket.io client

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

const API_URL = "http://localhost:5000";

interface Member {
  username: string;
  name: string;
  avatar?: string;
  is_ready?: boolean;
  is_host?: boolean;
}

export default function DateLobbyScreen() {
  const params = useLocalSearchParams();
  const dateCode = (params.dateCode as string) || "";
  let defaultDateName = (params.dateName as string) || "Romantic Evening";

  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");

  const [isLoading, setIsLoading] = useState(false);
  const [dateName, setDateName] = useState(defaultDateName);
  const [inviteCode, setInviteCode] = useState(dateCode);
  const [members, setMembers] = useState<Member[]>([]);
  const [partnerName, setPartnerName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isHostReady, setIsHostReady] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPartnerReady, setIsPartnerReady] = useState(false);
  const [isDateCreator, setIsDateCreator] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [allRequiredReady, setAllRequiredReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

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

    // Auto-dismiss after the specified duration
    setTimeout(() => {
      setToast({ visible: false, message: "", type: "info" });
    }, duration);
  };

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Fetch date members from API - moved outside to make it available
  const fetchDateMembers = async (
    code: string,
    token: string | Promise<string>,
    user: any
  ) => {
    try {
      if (token instanceof Promise) {
        token = await token;
      }

      const membersResponse = await fetch(`${API_URL}/groups/${code}/members`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!membersResponse.ok) {
        const errorData = await membersResponse.json();
        console.error("Failed to get date members:", errorData.error);
        return;
      }

      const membersData = await membersResponse.json();

      // Process the members data - add avatar URLs and check ready status
      const processedMembers = membersData.members.map((member: Member) => {
        // Use a default avatar or generate one based on name
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          member.name
        )}&background=random`;

        return {
          ...member,
          avatar: avatarUrl,
        };
      });

      setMembers(processedMembers);

      // Find the current user and update ready status
      const currentMember = processedMembers.find(
        (m: Member) => m.username === user.username
      );
      if (currentMember) {
        setIsHostReady(currentMember.is_ready || false);
      }

      // Check if there's a partner and if they're ready
      if (processedMembers.length > 1) {
        const partner = processedMembers.find(
          (m: Member) => m.username !== user.username
        );
        if (partner) {
          setIsPartnerReady(partner.is_ready || false);
        }
      }
    } catch (error) {
      console.error("Error fetching date members:", error);
    }
  };

  // Modificar o handler de members_update para usar a mesma lógica do group-lobby
  const initializeSocket = (username: string) => {
    // Initialize Socket.io connection
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      // Join the room with username included
      socket.emit("join_group", {
        group_code: dateCode,
        username: username,
      });
      console.log(`Joined room: ${dateCode} as ${username}`);
    });

    // Handler for members update with the logic from group-lobby
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
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  member[1] || "User"
                )}&background=random`,
              };
            } else if (typeof member === "object" && member !== null) {
              // If already an object, use directly but add avatar
              return {
                ...member,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  member.name || "User"
                )}&background=random`,
              };
            }
            return null;
          })
          .filter((member) => member !== null);

        console.log("Formatted members:", formattedMembers);

        // Update state with formatted members
        setMembers(formattedMembers);

        // Check if all non-host members are ready (copiado do group-lobby)
        const regularMembers = formattedMembers.filter((m) => !m.is_host);
        const readyRegularMembers = regularMembers.filter(
          (m) => m.is_ready
        ).length;

        setReadyCount(readyRegularMembers);
        setAllRequiredReady(
          readyRegularMembers === regularMembers.length &&
            regularMembers.length > 0
        );

        // Update current user's status
        if (currentUser?.username) {
          const currentMember = formattedMembers.find(
            (m) => m.username === currentUser.username
          );
          if (currentMember) {
            setIsHostReady(currentMember.is_ready || false);
            setIsDateCreator(currentMember.is_host || false);
          }
        }

        // Check if there's a partner and if they're ready
        if (currentUser?.username) {
          const partner = formattedMembers.find(
            (m) => m.username !== currentUser.username
          );
          if (partner) {
            setIsPartnerReady(partner.is_ready || false);
          }
        }
      } else {
        console.error("Invalid members data format:", data);
      }
    });

    // Handle member_left event
    socket.on("member_left", (data) => {
      if (data && data.username && data.username !== username) {
        // Show toast notification about the member leaving
        setToast({
          visible: true,
          message: `${data.name || data.username} has left the date`,
          type: "info",
        });

        // Toast will auto-dismiss after a few seconds
        setTimeout(() => {
          setToast({ visible: false, message: "", type: "info" });
        }, 3000);

        // Refresh member list
        fetchDateMembers(
          dateCode,
          AsyncStorage.getItem("userToken") as any,
          currentUser
        );
      }
    });

    // Handle group_dissolved event
    socket.on("group_dissolved", (data) => {
      if (!isDateCreator) {
        // Show a toast notification
        setToast({
          visible: true,
          message: "The date has been cancelled by your partner",
          type: "info",
        });

        // Delay navigation to allow toast to be seen
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      }
    });

    // Add handler for user_joined event - FIXED: moved inside initializeSocket
    socket.on("user_joined", (data) => {
      if (data && data.username && data.username !== username) {
        // Show toast notification about the new user
        setToast({
          visible: true,
          message: `${data.name || data.username} has joined your date!`,
          type: "info",
        });

        // Toast will auto-dismiss after a few seconds
        setTimeout(() => {
          setToast({ visible: false, message: "", type: "info" });
        }, 3000);

        // Refresh member list
        fetchDateMembers(
          dateCode,
          AsyncStorage.getItem("userToken") as any,
          currentUser
        );
      }
    });
  };
  // Adicionar este useEffect para contar os membros prontos (copiado do group-lobby)
  useEffect(() => {
    if (members.length > 0) {
      // Filter out the host from the count
      const regularMembers = members.filter((m) => !m.is_host);
      const readyRegularMembers = regularMembers.filter(
        (m) => m.is_ready
      ).length;

      setReadyCount(readyRegularMembers);

      // Check if all non-host members are ready
      setAllRequiredReady(
        readyRegularMembers === regularMembers.length &&
          regularMembers.length > 0
      );
    }
  }, [members]);
  // Load user data and date info when component mounts
  useEffect(() => {
    const loadUserAndDateInfo = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        const userToken = await AsyncStorage.getItem("userToken");

        if (!userData || !userToken) {
          showToast("Please login first to continue", "error");
          router.replace({ pathname: "/(auth)/login" });
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);

        // If dateCode is provided, load date info from API
        if (dateCode) {
          await fetchDateInfo(dateCode, userToken, user);
        } else {
          // This shouldn't happen, but handle it gracefully
          showToast("No date code provided", "error");
          router.back();
        }
      } catch (error) {
        console.error("Error loading user or date info:", error);
        showToast(
          "Failed to load date information. Please try again.",
          "error"
        );
      }
    };

    loadUserAndDateInfo();

    // Clean up function for socket
    return () => {
      if (socketRef.current) {
        // Explicitly leave room before disconnecting
        socketRef.current.emit("leave_group", { group_code: dateCode });
        socketRef.current.disconnect();
      }
    };
  }, [dateCode]);

  // Fetch date info from API
  const fetchDateInfo = async (code: string, token: string, user: any) => {
    try {
      setIsLoading(true);

      // Get group info
      const infoResponse = await fetch(`${API_URL}/groups/${code}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!infoResponse.ok) {
        const errorData = await infoResponse.json();
        showToast(errorData.error || "Failed to get date information", "error");
        router.back();
        return;
      }

      const infoData = await infoResponse.json();
      setDateName(infoData.group.name);
      setIsDateCreator(infoData.group.creator_username === user.username);

      // Get group members
      await fetchDateMembers(code, token, user);

      // Initialize socket only after we have user data
      initializeSocket(user.username);
    } catch (error) {
      console.error("Error fetching date info:", error);
      showToast("Failed to get date information. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Share invite code
  const shareInviteCode = async () => {
    try {
      await Share.share({
        message: `Join me for a romantic dinner with BiteFinder! Use code: ${inviteCode}`,
      });
    } catch (error) {
      showToast("Could not share invite code", "error");
    }
  };

  // Replace toggleHostReadyStatus error handling
  const toggleHostReadyStatus = async () => {
    try {
      setIsUpdatingStatus(true);

      // Get user token
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        showToast("Please login first to continue", "error");
        router.replace({ pathname: "/(auth)/login" });
        return;
      }

      // Call API to update ready status
      const response = await fetch(`${API_URL}/groups/${inviteCode}/ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          username: currentUser.username,
          is_ready: !isHostReady,
        }),
      });

      if (response.ok) {
        // Update local state
        setIsHostReady(!isHostReady);
        showToast(
          isHostReady ? "You're now waiting" : "You're now ready",
          "info"
        );
        // The socket will update the members list for all users
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error updating ready status:", error);
      showToast("Failed to update status. Please try again.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle leaving date (previously cancelDate)
  const handleLeaveDate = async () => {
    try {
      setIsLeaving(true);
      setLeaveError("");
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        router.replace("/(tabs)");
        return;
      }

      // If user is host, first emit the dissolution event
      if (isDateCreator && socketRef.current?.connected) {
        console.log("Host is dissolving date:", inviteCode);

        // Emit the event and verify it was sent
        socketRef.current.emit("group_dissolved_by_host", {
          group_code: inviteCode,
          message: "The host has ended the date",
        });

        // Add a delay to ensure the message has time to be processed
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Call API to leave/dissolve group
      const response = await fetch(`${API_URL}/groups/${inviteCode}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          username: currentUser.username,
          is_host: isDateCreator,
        }),
      });

      if (response.ok) {
        // Navigate back to home
        router.replace("/(tabs)");
      } else {
        const errorData = await response.json();
        setLeaveError(errorData.error || "Failed to leave date");
        setTimeout(() => setLeaveError(""), 5000);
      }
    } catch (error) {
      console.error("Error leaving date:", error);
      setLeaveError("Network error. Failed to leave date.");
      setTimeout(() => setLeaveError(""), 5000);
    } finally {
      setIsLeaving(false);
    }
  };

  const startDateSelection = async () => {
    // Check if host is ready
    if (!isHostReady) {
      showToast("Please mark yourself as ready first", "error");
      return;
    }

    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        showToast("Please login first to continue", "error");
        router.replace({ pathname: "/(auth)/login" });
        return;
      }

      // If not all required members are ready, show confirmation
      if (!allRequiredReady) {
        // Get count of members excluding the host
        const regularMembers = members.filter((m) => !m.is_host);

        // We'll use a different approach since Alert.confirm is not easy to replace with toast
        // For simplicity, we'll just show a toast and continue anyway
        showToast(
          `Only ${readyCount} of ${regularMembers.length} members are ready, starting anyway`,
          "info"
        );

        // Call API to start restaurant selection
        const response = await fetch(`${API_URL}/groups/${inviteCode}/start`, {
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
            params: { groupCode: inviteCode },
          });
        } else {
          const errorData = await response.json();
          showToast(errorData.error || "Failed to start selection", "error");
        }
      } else {
        // All required members are ready, start the selection
        const response = await fetch(`${API_URL}/groups/${inviteCode}/start`, {
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
            params: { groupCode: inviteCode },
          });
        } else {
          const errorData = await response.json();
          showToast(errorData.error || "Failed to start selection", "error");
        }
      }
    } catch (error) {
      console.error("Error starting date selection:", error);
      showToast(
        "Failed to start restaurant selection. Please try again.",
        "error"
      );
    }
  };

  // If still loading initial data
  if (isLoading && members.length === 0) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <ThemedText style={styles.loadingText}>
          Loading date information...
        </ThemedText>
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
            { backgroundColor: toast.type === "error" ? "#FF6B6B" : "#FF6B9D" },
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

      {/* Show leave error if any */}
      {leaveError ? (
        <View style={styles.errorBanner}>
          <ThemedText style={styles.errorText}>{leaveError}</ThemedText>
        </View>
      ) : null}

      {/* Header - Removed back button, using same leave style as group-lobby */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Date Night
        </ThemedText>

        <TouchableOpacity
          onPress={handleLeaveDate}
          style={styles.leaveButton}
          disabled={isLeaving}
        >
          {isLeaving ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Ionicons name="exit-outline" size={24} color="#FF6B6B" />
          )}
        </TouchableOpacity>
      </ThemedView>

      {/* Date Info Card */}
      <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
        <ThemedView style={styles.dateNameContainer}>
          {isEditing ? (
            <TextInput
              style={[styles.dateNameInput, { color: textColor }]}
              value={dateName}
              onChangeText={setDateName}
              autoFocus
              onBlur={() => setIsEditing(false)}
              onSubmitEditing={() => setIsEditing(false)}
            />
          ) : (
            <TouchableOpacity
              style={styles.dateNameRow}
              onPress={() => isDateCreator && setIsEditing(true)}
              disabled={!isDateCreator}
            >
              <ThemedText type="title" style={styles.dateName}>
                {dateName}
              </ThemedText>
              {isDateCreator && (
                <Ionicons
                  name="pencil"
                  size={16}
                  color={textColor}
                  style={styles.editIcon}
                />
              )}
            </TouchableOpacity>
          )}
        </ThemedView>

        <ThemedView style={styles.codeContainer}>
          <ThemedView style={styles.codeBox}>
            <ThemedText style={styles.codeText}>{inviteCode}</ThemedText>
          </ThemedView>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: "#FF6B9D" }]}
            onPress={shareInviteCode}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </ThemedView>

        <ThemedText style={styles.codeHint}>
          Share this code with your date partner
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={[styles.readyStatusBox, { backgroundColor: cardColor }]}
      >
        <ThemedText style={styles.readyStatusTitle}>Your Status</ThemedText>

        {!isDateCreator ? (
          <TouchableOpacity
            style={[
              styles.readyButton,
              { backgroundColor: isHostReady ? "#4CAF50" : "#FFC107" },
            ]}
            onPress={toggleHostReadyStatus}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <View style={styles.updatingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <ThemedText style={styles.readyButtonText}>
                  Updating...
                </ThemedText>
              </View>
            ) : (
              <>
                <Ionicons
                  name={isHostReady ? "checkmark-circle" : "time-outline"}
                  size={20}
                  color="#fff"
                  style={styles.readyIcon}
                />
                <ThemedText style={styles.readyButtonText}>
                  {isHostReady ? "I'm Ready" : "Mark as Ready"}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <ThemedView
            style={[
              styles.hostStatusBanner,
              { backgroundColor: allRequiredReady ? "#4CAF50" : "#FFC107" },
            ]}
          >
            <Ionicons
              name={allRequiredReady ? "checkmark-circle" : "people-outline"}
              size={24}
              color="#fff"
              style={styles.readyIcon}
            />
            <ThemedText style={styles.hostStatusText}>
              {allRequiredReady
                ? "Everyone is Ready!"
                : `Waiting - ${readyCount}/${
                    members.filter((m) => !m.is_host).length
                  } Ready`}
            </ThemedText>
          </ThemedView>
        )}

        {isDateCreator && (
          <ThemedText style={styles.hostNote}>
            As the host, you don't need to get ready. You can start when your
            partner is ready.
          </ThemedText>
        )}
      </ThemedView>

      {/* Members Cards */}
      <ThemedView style={styles.membersSection}>
        <View style={styles.membersHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Date Members
          </ThemedText>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() =>
              fetchDateMembers(
                inviteCode,
                AsyncStorage.getItem("userToken") as any,
                currentUser
              )
            }
          >
            <Ionicons name="refresh-outline" size={20} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Members list */}
        {members.map((member, index) => (
          <ThemedView
            key={member.username}
            style={[styles.memberCard, { backgroundColor: cardColor }]}
          >
            {member.avatar ? (
              <Image
                source={{ uri: member.avatar }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    backgroundColor: member.is_host
                      ? "#4ECDC4"
                      : member.is_ready
                      ? "#4CAF50"
                      : "#FFC107",
                  },
                ]}
              >
                <ThemedText style={styles.avatarInitial}>
                  {member.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}

            <ThemedView style={styles.memberInfo}>
              <ThemedText style={styles.memberName}>
                {member.name}
                {member.username === currentUser?.username ? " (You)" : ""}
              </ThemedText>

              <ThemedView
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: member.is_host
                      ? "#4ECDC4"
                      : member.is_ready
                      ? "#4CAF50"
                      : "#FFC107",
                  },
                ]}
              >
                <ThemedText style={styles.statusText}>
                  {member.is_host
                    ? "Host"
                    : member.is_ready
                    ? "Ready"
                    : "Waiting"}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        ))}

        {/* Empty partner placeholder */}
        {members.length === 1 && (
          <ThemedView
            style={[
              styles.memberCard,
              { backgroundColor: cardColor, opacity: 0.7 },
            ]}
          >
            <View
              style={[styles.avatarPlaceholder, { backgroundColor: "#CCCCCC" }]}
            >
              <ThemedText style={styles.avatarInitial}>?</ThemedText>
            </View>

            <ThemedView style={styles.memberInfo}>
              <ThemedText style={[styles.memberName, { fontStyle: "italic" }]}>
                Waiting for partner to join...
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>

      {/* Action Buttons */}
      <ThemedView style={styles.actionButtons}>
        {isDateCreator && (
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                backgroundColor:
                  isHostReady && (allRequiredReady || members.length === 1)
                    ? "#FF6B9D"
                    : "#FFB0C9",
                opacity:
                  isHostReady && (allRequiredReady || members.length === 1)
                    ? 1
                    : 0.8,
              },
            ]}
            onPress={startDateSelection}
            disabled={!isHostReady}
          >
            <Ionicons
              name="heart"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.buttonText}>
              {!isHostReady
                ? "Mark yourself as ready first"
                : !allRequiredReady &&
                  members.filter((m) => !m.is_host).length > 0
                ? `Waiting for members (${readyCount}/${
                    members.filter((m) => !m.is_host).length
                  } Ready)`
                : "Find Restaurant Together"}
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // ... rest of styles remain unchanged
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  // Toast and error styles
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
  hostStatusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  hostNote: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: "center",
  },
  toastMessage: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
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
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
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
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  leaveButton: {
    padding: 8,
    borderRadius: 20,
  },
  cancelButton: {
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
  },
  dateNameContainer: {
    marginBottom: 16,
  },
  dateNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  dateNameInput: {
    fontSize: 24,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#FF6B9D",
    padding: 4,
  },
  editIcon: {
    marginLeft: 8,
    opacity: 0.6,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: "rgba(255, 107, 157, 0.1)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  codeText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: "#FF6B9D",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  codeHint: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },

  // New styles for ready status
  readyStatusBox: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  readyStatusTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  readyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 12,
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
  updatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  readyStatusHint: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },

  // Existing styles...
  inviteSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  membersSection: {
    paddingHorizontal: 16,
    flex: 1,
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
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(78, 205, 196, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reminderText: {
    color: "#4ECDC4",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  actionButtons: {
    padding: 16,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelDateButton: {
    alignItems: "center",
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  partnerStatusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  partnerStatusText: {
    color: "#fff",
    fontWeight: "600",
  },
});
