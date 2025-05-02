import { useState, useEffect } from "react";
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

  // Load user data and date info when component mounts
  useEffect(() => {
    const loadUserAndDateInfo = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        const userToken = await AsyncStorage.getItem("userToken");

        if (!userData || !userToken) {
          Alert.alert("Not logged in", "Please login first to continue");
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
          Alert.alert("Error", "No date code provided");
          router.back();
        }
      } catch (error) {
        console.error("Error loading user or date info:", error);
        Alert.alert(
          "Error",
          "Failed to load date information. Please try again."
        );
      }
    };

    loadUserAndDateInfo();
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
        Alert.alert(
          "Error",
          errorData.error || "Failed to get date information"
        );
        router.back();
        return;
      }

      const infoData = await infoResponse.json();
      setDateName(infoData.group.name);
      setIsDateCreator(infoData.group.creator_username === user.username);

      // Get group members
      await fetchDateMembers(code, token, user);
    } catch (error) {
      console.error("Error fetching date info:", error);
      Alert.alert("Error", "Failed to get date information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch date members from API
  const fetchDateMembers = async (code: string, token: string, user: any) => {
    try {
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

  // Function to invite partner
  const invitePartner = async () => {
    if (!partnerName.trim()) {
      Alert.alert("Error", "Please enter your date's name");
      return;
    }

    try {
      setIsLoading(true);

      // Get user token
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert("Not logged in", "Please login first to continue");
        router.replace({ pathname: "/(auth)/login" });
        return;
      }

      // In a real API call, you would send the invite
      // For now, we'll just show success message and update UI
      Alert.alert(
        "Invitation Ready",
        `Share this code with ${partnerName} to invite them to your date: ${inviteCode}`,
        [
          { text: "Copy Code", onPress: () => shareInviteCode() },
          { text: "OK" },
        ]
      );

      setPartnerName("");
    } catch (error) {
      console.error("Error inviting partner:", error);
      Alert.alert("Error", "Failed to invite partner. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    Clipboard.setString(inviteCode);
    Alert.alert("Success", "Invite code copied to clipboard");
  };

  // Share invite code
  const shareInviteCode = async () => {
    try {
      await Share.share({
        message: `Join me for dinner with BiteFinder! Use code: ${inviteCode}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share invite code");
    }
  };

  // Toggle the host's ready status
  const toggleHostReadyStatus = async () => {
    try {
      setIsUpdatingStatus(true);

      // Get user token
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert("Not logged in", "Please login first to continue");
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

        // Update the members list
        setMembers(
          members.map((member) => {
            if (member.username === currentUser.username) {
              return {
                ...member,
                is_ready: !isHostReady,
              };
            }
            return member;
          })
        );

        // Fetch updated members list
        fetchDateMembers(inviteCode, userToken, currentUser);
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating ready status:", error);
      Alert.alert("Error", "Failed to update status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Start the date selection process
  const startDateSelection = async () => {
    // Check if host is ready
    if (!isHostReady) {
      Alert.alert("Not Ready", "Please mark yourself as ready first.");
      return;
    }

    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert("Not logged in", "Please login first to continue");
        router.replace({ pathname: "/(auth)/login" });
        return;
      }

      // If partner hasn't joined or isn't ready, show a confirmation dialog
      if (members.length < 2 || !isPartnerReady) {
        Alert.alert(
          members.length < 2 ? "No Partner" : "Partner Not Ready",
          members.length < 2
            ? "You don't have a partner yet. Do you want to start anyway?"
            : "Your partner isn't ready yet. Do you want to start anyway?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Start Anyway",
              onPress: async () => {
                // Call API to start restaurant selection
                const response = await fetch(
                  `${API_URL}/groups/${inviteCode}/start`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${userToken}`,
                    },
                  }
                );

                if (response.ok) {
                  // Navigate to restaurant selection screen
                  router.push({
                    pathname: "/restaurant/group-selection",
                    params: { groupCode: inviteCode },
                  });
                } else {
                  const errorData = await response.json();
                  Alert.alert(
                    "Error",
                    errorData.error || "Failed to start selection"
                  );
                }
              },
            },
          ]
        );
      } else {
        // Both users are ready, start the selection
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
          Alert.alert("Error", errorData.error || "Failed to start selection");
        }
      }
    } catch (error) {
      console.error("Error starting date selection:", error);
      Alert.alert(
        "Error",
        "Failed to start restaurant selection. Please try again."
      );
    }
  };

  // Cancel the date session
  const cancelDate = () => {
    Alert.alert(
      "Cancel Date",
      "Are you sure you want to cancel this date planning?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const userToken = await AsyncStorage.getItem("userToken");

              if (!userToken) {
                router.replace("/(tabs)");
                return;
              }

              // Leave/dissolve the date group
              const response = await fetch(
                `${API_URL}/groups/${inviteCode}/leave`,
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
                router.replace("/(tabs)");
              } else {
                const errorData = await response.json();
                Alert.alert(
                  "Error",
                  errorData.error || "Failed to cancel date"
                );
                router.replace("/(tabs)");
              }
            } catch (error) {
              console.error("Error canceling date:", error);
              Alert.alert("Error", "Failed to cancel date. Please try again.");
              router.replace("/(tabs)");
            }
          },
        },
      ]
    );
  };

  // Check partner status
  const checkPartnerStatus = async () => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        return;
      }

      // Refresh member list to check partner status
      await fetchDateMembers(inviteCode, userToken, currentUser);

      // If partner is now ready, show alert
      const partner = members.find((m) => m.username !== currentUser.username);
      if (partner && partner.is_ready && !isPartnerReady) {
        Alert.alert("Partner Ready", `${partner.name} is now ready!`);
        setIsPartnerReady(true);
      } else if (partner && !partner.is_ready && isPartnerReady) {
        Alert.alert("Partner Update", `${partner.name} is not ready yet.`);
        setIsPartnerReady(false);
      } else if (!partner && members.length < 2) {
        Alert.alert("No Partner", "Your partner hasn't joined yet.");
      }
    } catch (error) {
      console.error("Error checking partner status:", error);
    }
  };

  // UI for Status Badge
  const renderStatusBadge = (status: string, isReady: boolean) => {
    let backgroundColor = "#FFC107"; // Default yellow for pending
    let statusText = "Pending";

    if (status === "host") {
      backgroundColor = "#4ECDC4"; // Teal for host
      statusText = "Host";
    } else if (isReady) {
      backgroundColor = "#4CAF50"; // Green for ready
      statusText = "Ready";
    } else if (status === "ready") {
      backgroundColor = "#FFC107"; // Yellow for joined but not ready
      statusText = "Not Ready";
    }

    return (
      <ThemedView style={[styles.statusBadge, { backgroundColor }]}>
        <ThemedText style={styles.statusText}>{statusText}</ThemedText>
      </ThemedView>
    );
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

      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>

        <ThemedView style={styles.headerContent}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Date Night
          </ThemedText>
        </ThemedView>

        <TouchableOpacity onPress={cancelDate} style={styles.cancelButton}>
          <Ionicons name="close-circle-outline" size={24} color="#FF6B6B" />
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

      {/* Status Box - Ready status */}
      <ThemedView
        style={[styles.readyStatusBox, { backgroundColor: cardColor }]}
      >
        <ThemedText style={styles.readyStatusTitle}>Your Status</ThemedText>

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

        <ThemedText style={styles.readyStatusHint}>
          Mark yourself as ready when you're prepared to choose restaurants
        </ThemedText>
      </ThemedView>

      {/* Partner Invite */}
      {isDateCreator && members.length < 2 && (
        <ThemedView style={styles.inviteSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Invite Your Date
          </ThemedText>

          <ThemedView style={styles.searchContainer}>
            <Ionicons
              name="heart"
              size={20}
              color="#FF6B9D"
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Enter your date's name"
              placeholderTextColor="#888"
              value={partnerName}
              onChangeText={setPartnerName}
              returnKeyType="send"
              onSubmitEditing={invitePartner}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: "#FF6B9D" }]}
              onPress={invitePartner}
              disabled={isLoading || !partnerName.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      )}

      {/* Members Cards */}
      <ThemedView style={styles.membersSection}>
        <View style={styles.membersHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Date Members
          </ThemedText>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={checkPartnerStatus}
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
                backgroundColor: isHostReady ? "#FF6B9D" : "#FFB0C9",
                opacity: isHostReady ? 1 : 0.8,
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
              {isHostReady
                ? "Find Restaurant Together"
                : "Mark yourself as ready first"}
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelDateButton} onPress={cancelDate}>
          <ThemedText style={[styles.cancelButtonText, { color: "#FF6B6B" }]}>
            {isDateCreator ? "Cancel Date" : "Leave Date"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: "600",
  },
  backButton: {
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
});
