import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  View,
  Animated,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/contexts/AuthContext";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Data interfaces
interface Friend {
  id: string;
  name: string;
  username: string;
}

interface FriendRequest {
  id: string;
  name: string;
  username: string;
}

interface User {
  id: string;
  name: string;
  username: string;
}

// Confirmation modal props interface
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Mock data for testing UI
const MOCK_FRIENDS: Friend[] = [
  { id: "1", name: "Alice Johnson", username: "@alice_j" },
  { id: "2", name: "Bob Smith", username: "@bobsmith" },
  { id: "3", name: "Carol White", username: "@carol_white" },
];

const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  { id: "4", name: "David Brown", username: "@dave_b" },
  { id: "5", name: "Eve Taylor", username: "@eve_taylor" },
];

// Mock search results
const MOCK_USERS: User[] = [
  { id: "6", name: "Frank Miller", username: "@frank_m" },
  { id: "7", name: "Grace Wilson", username: "@gracew" },
  { id: "8", name: "Henry Davis", username: "@henryd" },
  { id: "9", name: "Irene Garcia", username: "@irene_g" },
];

// Confirmation Modal Component
const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmationModalProps): React.ReactElement => {
  // Theme colors
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  // Animation state
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Animation effect when modal visibility changes
  useEffect(() => {
    if (visible) {
      // Fade in and scale up when visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out when hiding
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      {/* Modal Background Overlay */}
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        {/* Modal Content Container with Animation */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: "80%",
          }}
        >
          {/* Modal Content */}
          <ThemedView style={styles.modalContainer}>
            {/* Modal Title */}
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>

            {/* Modal Message */}
            <ThemedText style={styles.modalMessage}>{message}</ThemedText>

            {/* Modal Action Buttons */}
            <View style={styles.modalButtons}>
              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onCancel}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: tintColor },
                ]}
                onPress={onConfirm}
              >
                <ThemedText style={styles.buttonText}>Confirm</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function FriendsScreen() {
  // Authentication context
  const { user } = useAuth();

  // Theme colors
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  // State management for tabs and data
  const [activeTab, setActiveTab] = useState<
    "friends" | "requests" | "search" | "joinGroup"
  >("friends");
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [friendRequests, setFriendRequests] =
    useState<FriendRequest[]>(MOCK_FRIEND_REQUESTS);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Animation for tab transitions
  const [fadeAnim] = useState(new Animated.Value(1));

  // Modal states for friend removal
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

  // Modal states for friend request acceptance
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [requestToAccept, setRequestToAccept] = useState<FriendRequest | null>(
    null
  );
  const [groupCode, setGroupCode] = useState("");

  // Tab change handler with animation
  const changeTab = (tab: "friends" | "requests" | "search" | "joinGroup") => {
    // Animate tab transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        delay: 50,
      }),
    ]).start();

    // Change tab after fade out animation
    setTimeout(() => {
      setActiveTab(tab);
    }, 150);
  };

  // User search function
  const searchUsers = (): void => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const results = MOCK_USERS.filter(
        (mockUser) =>
          mockUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mockUser.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsLoading(false);
    }, 500);
  };

  // New function to handle joining a group
  const handleJoinGroup = () => {
    if (!groupCode.trim()) {
      Alert.alert("Error", "Please enter a group code");
      return;
    }

    // Simulate joining a group
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);

      // Simulate successful join
      Alert.alert("Success", "You've successfully joined the group!", [
        { text: "OK", onPress: () => setGroupCode("") },
      ]);
    }, 1000);
  };

  // Friend request sending function
  const sendFriendRequest = (recipientId: string): void => {
    Alert.alert("Success", "Friend request sent!");
    // Remove from search results to simulate the request was sent
    setSearchResults((prev) =>
      prev.filter((mockUser) => mockUser.id !== recipientId)
    );
  };

  // Friend request acceptance handler - opens confirmation modal
  const promptAcceptFriendRequest = (request: FriendRequest): void => {
    setRequestToAccept(request);
    setAcceptModalVisible(true);
  };

  // Confirm friend request acceptance
  const confirmAcceptFriendRequest = (): void => {
    if (requestToAccept) {
      // Move from requests to friends
      setFriends((prev) => [...prev, requestToAccept]);
      setFriendRequests((prev) =>
        prev.filter((req) => req.id !== requestToAccept.id)
      );

      // Close modal
      setAcceptModalVisible(false);
      setRequestToAccept(null);

      // Show success message
      Alert.alert("Success", "Friend request accepted!");
    }
  };

  // Cancel friend request acceptance
  const cancelAcceptFriendRequest = (): void => {
    setAcceptModalVisible(false);
    setRequestToAccept(null);
  };

  // Reject friend request handler
  const rejectFriendRequest = (senderId: string): void => {
    // Remove from requests
    setFriendRequests((prev) => prev.filter((req) => req.id !== senderId));
    Alert.alert("Success", "Friend request rejected");
  };

  // Friend removal handler - opens confirmation modal
  const promptRemoveFriend = (friend: Friend): void => {
    setFriendToRemove(friend);
    setRemoveModalVisible(true);
  };

  // Confirm friend removal
  const confirmRemoveFriend = (): void => {
    if (friendToRemove) {
      // Remove from friends list
      setFriends((prev) =>
        prev.filter((friend) => friend.id !== friendToRemove.id)
      );

      // Close modal and reset the selected friend
      setRemoveModalVisible(false);
      setFriendToRemove(null);

      // Show success message
      Alert.alert("Success", "Friend removed");
    }
  };

  // Cancel friend removal
  const cancelRemoveFriend = (): void => {
    setRemoveModalVisible(false);
    setFriendToRemove(null);
  };

  // Render friend list item
  const renderFriendItem = ({ item }: { item: Friend }): React.ReactElement => (
    <ThemedView style={styles.card}>
      {/* Friend Info */}
      <ThemedView style={styles.userInfo}>
        <ThemedText style={styles.userUsername}>{item.username}</ThemedText>
        <ThemedText style={styles.userName}>
          {item.name || "No name"}
        </ThemedText>
      </ThemedView>

      {/* Remove Friend Button */}
      <TouchableOpacity
        style={[styles.iconButton, styles.removeButton]}
        onPress={() => promptRemoveFriend(item)}
      >
        <IconSymbol name="xmark" size={20} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );

  // Render friend request list item
  const renderRequestItem = ({
    item,
  }: {
    item: FriendRequest;
  }): React.ReactElement => (
    <ThemedView style={styles.card}>
      {/* Request User Info */}
      <ThemedView style={styles.userInfo}>
        <ThemedText style={styles.userUsername}>{item.username}</ThemedText>
        <ThemedText style={styles.userName}>
          {item.name || "No name"}
        </ThemedText>
      </ThemedView>

      {/* Request Action Buttons */}
      <ThemedView style={styles.actionButtons}>
        {/* Accept Request Button */}
        <TouchableOpacity
          style={[styles.iconButton, styles.acceptButton]}
          onPress={() => promptAcceptFriendRequest(item)}
        >
          <IconSymbol name="right" size={20} color="white" />
        </TouchableOpacity>

        {/* Reject Request Button */}
        <TouchableOpacity
          style={[styles.iconButton, styles.removeButton]}
          onPress={() => rejectFriendRequest(item.id)}
        >
          <IconSymbol name="xmark" size={20} color="white" />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  // Render search result list item
  const renderSearchResultItem = ({
    item,
  }: {
    item: User;
  }): React.ReactElement => (
    <ThemedView style={styles.card}>
      {/* Search Result User Info */}
      <ThemedView style={styles.userInfo}>
        <ThemedText style={styles.userUsername}>{item.username}</ThemedText>
        <ThemedText style={styles.userName}>
          {item.name || "No name"}
        </ThemedText>
      </ThemedView>

      {/* Add Friend Button */}
      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: tintColor }]}
        onPress={() => sendFriendRequest(item.id)}
      >
        <IconSymbol name="person.badge.plus" size={20} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Screen Title */}
      <ThemedText type="title" style={styles.title}>
        Friends
      </ThemedText>

      {/* Tab Navigation Bar */}
      <ThemedView style={styles.tabBarContainer}>
        <ThemedView style={styles.tabBar}>
          {/* Friends Tab */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "friends" && [
                styles.activeTab,
                { borderBottomColor: tintColor },
              ],
            ]}
            onPress={() => changeTab("friends")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "friends" && {
                  color: tintColor,
                  fontWeight: "bold",
                },
              ]}
            >
              My Friends
            </ThemedText>
          </TouchableOpacity>

          {/* Friend Requests Tab */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "requests" && [
                styles.activeTab,
                { borderBottomColor: tintColor },
              ],
            ]}
            onPress={() => changeTab("requests")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "requests" && {
                  color: tintColor,
                  fontWeight: "bold",
                },
              ]}
            >
              Requests{" "}
              {friendRequests.length > 0 ? `(${friendRequests.length})` : ""}
            </ThemedText>
          </TouchableOpacity>

          {/* Add Friends Tab */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "search" && [
                styles.activeTab,
                { borderBottomColor: tintColor },
              ],
            ]}
            onPress={() => changeTab("search")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "search" && {
                  color: tintColor,
                  fontWeight: "bold",
                },
              ]}
            >
              Add Friends
            </ThemedText>
          </TouchableOpacity>

          {/* Join Group Tab */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "joinGroup" && [
                styles.activeTab,
                { borderBottomColor: tintColor },
              ],
            ]}
            onPress={() => changeTab("joinGroup")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "joinGroup" && {
                  color: tintColor,
                  fontWeight: "bold",
                },
              ]}
            >
              Join Group
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Content Container with Animation */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Search Bar (only on search tab) */}
        {activeTab === "search" && (
          <ThemedView style={styles.searchContainer}>
            {/* Search Input */}
            <TextInput
              style={[
                styles.searchInput,
                { color: textColor, borderColor: textColor + "40" },
              ]}
              placeholder="Search by name or username"
              placeholderTextColor={textColor + "80"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={searchUsers}
            />
            {/* Search Button */}
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: tintColor }]}
              onPress={searchUsers}
              disabled={isLoading}
            >
              <IconSymbol name="magnifyingglass" size={20} color="white" />
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Friends List (friends tab) */}
        {activeTab === "friends" && (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item: Friend) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                You dont have any friends yet
              </ThemedText>
            }
          />
        )}

        {/* Join Group Section */}
        {activeTab === "joinGroup" && (
          <ThemedView style={styles.joinGroupContainer}>
            <ThemedText style={styles.joinGroupHeader}>
              Enter Group Code
            </ThemedText>

            <ThemedText style={styles.joinGroupDescription}>
              Enter the code provided by the group admin to join a group.
            </ThemedText>

            <ThemedView style={styles.codeInputContainer}>
              <TextInput
                style={[
                  styles.codeInput,
                  { color: textColor, borderColor: textColor + "40" },
                ]}
                placeholder="Enter group code"
                placeholderTextColor={textColor + "80"}
                value={groupCode}
                onChangeText={setGroupCode}
                autoCapitalize="characters"
                maxLength={8}
              />

              <TouchableOpacity
                style={[styles.joinButton, { backgroundColor: tintColor }]}
                onPress={handleJoinGroup}
                disabled={isLoading || !groupCode.trim()}
              >
                <ThemedText style={styles.joinButtonText}>
                  {isLoading ? "Joining..." : "Join Group"}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedText style={styles.joinGroupHelp}>
              Group codes are typically 4-8 characters and are case-sensitive.
            </ThemedText>
          </ThemedView>
        )}

        {/* Friend Requests List (requests tab) */}
        {activeTab === "requests" && (
          <FlatList
            data={friendRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item: FriendRequest) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                No pending friend requests
              </ThemedText>
            }
          />
        )}

        {/* Search Results List (search tab) */}
        {activeTab === "search" && (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResultItem}
            keyExtractor={(item: User) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                {searchQuery
                  ? "No users found"
                  : "Search for users to add as friends"}
              </ThemedText>
            }
          />
        )}
      </Animated.View>

      {/* Confirmation Modal for Removing Friend */}
      <ConfirmationModal
        visible={removeModalVisible}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friendToRemove?.name} from your friends?`}
        onConfirm={confirmRemoveFriend}
        onCancel={cancelRemoveFriend}
      />

      {/* Confirmation Modal for Accepting Friend Request */}
      <ConfirmationModal
        visible={acceptModalVisible}
        title="Accept Friend Request"
        message={`Are you sure you want to accept the friend request from ${requestToAccept?.name}?`}
        onConfirm={confirmAcceptFriendRequest}
        onCancel={cancelAcceptFriendRequest}
      />
    </ThemedView>
  );
}

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

  // Tab bar container to handle overflow
  tabBarContainer: {
    marginBottom: 20,
  },

  // Updated tab bar styles for additional tab
  tabBar: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tab: {
    flex: 1,
    minWidth: "25%",
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    textAlign: "center",
  },

  // Join Group specific styles
  joinGroupContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  joinGroupHeader: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  joinGroupDescription: {
    textAlign: "center",
    marginBottom: 30,
    opacity: 0.8,
    lineHeight: 20,
  },
  codeInputContainer: {
    width: "100%",
    alignItems: "center",
  },
  codeInput: {
    width: "100%",
    height: 60,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 5,
    marginBottom: 20,
  },
  joinButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
  },
  joinButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  joinGroupHelp: {
    textAlign: "center",
    marginTop: 30,
    opacity: 0.6,
    fontSize: 14,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  // Search component styles
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchButton: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },

  // List styles
  listContent: {
    paddingBottom: 20,
  },

  // Card styles for list items
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userUsername: {
    fontSize: 14,
    opacity: 0.7,
    color: "#2196F3",
    marginBottom: 3,
    fontStyle: "italic",
    letterSpacing: 0.5,
    textShadowColor: "rgba(33, 150, 243, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Action button styles
  actionButtons: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  removeButton: {
    backgroundColor: "#F44336",
  },

  // Empty state text
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    opacity: 0.7,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "100%",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#9e9e9e",
  },
  confirmButton: {
    // Uses tintColor passed via props
  },
  buttonText: {
    color: "white",
    fontWeight: "500",
  },
});
