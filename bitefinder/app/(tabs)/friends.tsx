import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal, View, Animated } from 'react-native';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/contexts/AuthContext";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Properly typed interfaces
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

// New interface for the confirmation modal
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Hardcoded data for testing the UI
const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: 'Alice Johnson', username: '@alice_j' },
  { id: '2', name: 'Bob Smith', username: '@bobsmith' },
  { id: '3', name: 'Carol White', username: '@carol_white' },
];

const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  { id: '4', name: 'David Brown', username: '@dave_b' },
  { id: '5', name: 'Eve Taylor', username: '@eve_taylor' },
];

// Mock search results
const MOCK_USERS: User[] = [
  { id: '6', name: 'Frank Miller', username: '@frank_m' },
  { id: '7', name: 'Grace Wilson', username: '@gracew' },
  { id: '8', name: 'Henry Davis', username: '@henryd' },
  { id: '9', name: 'Irene Garcia', username: '@irene_g' },
];

// Confirmation Modal Component
const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel
}: ConfirmationModalProps): React.ReactElement => {
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  // Animation for modal appearance
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  useEffect(() => {
    if (visible) {
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
        })
      ]).start();
    } else {
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
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: '80%',
          }}
        >
          <ThemedView style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            <ThemedText style={styles.modalMessage}>{message}</ThemedText>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onCancel}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: tintColor }]}
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
  const { user } = useAuth();
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(MOCK_FRIEND_REQUESTS);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Tab transition animation
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Modal states
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  
  // Accept friend request modal
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [requestToAccept, setRequestToAccept] = useState<FriendRequest | null>(null);

  // Handle tab changes with animation
  const changeTab = (tab: 'friends' | 'requests' | 'search') => {
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
      })
    ]).start();
    
    setTimeout(() => {
      setActiveTab(tab);
    }, 150);
  };

  // Mock search function - properly typed
  const searchUsers = (): void => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const results = MOCK_USERS.filter(mockUser => 
        mockUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mockUser.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsLoading(false);
    }, 500);
  };

  // Mock friend actions - properly typed
  const sendFriendRequest = (recipientId: string): void => {
    Alert.alert("Success", "Friend request sent!");
    // Remove from search results to simulate the request was sent
    setSearchResults(prev => prev.filter(mockUser => mockUser.id !== recipientId));
  };

  // Functions to handle friend request acceptance with confirmation
  const promptAcceptFriendRequest = (request: FriendRequest): void => {
    setRequestToAccept(request);
    setAcceptModalVisible(true);
  };

  const confirmAcceptFriendRequest = (): void => {
    if (requestToAccept) {
      // Move from requests to friends
      setFriends(prev => [...prev, requestToAccept]);
      setFriendRequests(prev => prev.filter(req => req.id !== requestToAccept.id));
      
      // Close modal
      setAcceptModalVisible(false);
      setRequestToAccept(null);
      
      // Show success message
      Alert.alert("Success", "Friend request accepted!");
    }
  };

  const cancelAcceptFriendRequest = (): void => {
    setAcceptModalVisible(false);
    setRequestToAccept(null);
  };

  const rejectFriendRequest = (senderId: string): void => {
    // Remove from requests
    setFriendRequests(prev => prev.filter(req => req.id !== senderId));
    Alert.alert("Success", "Friend request rejected");
  };

  // Functions to handle friend removal with confirmation
  const promptRemoveFriend = (friend: Friend): void => {
    setFriendToRemove(friend);
    setRemoveModalVisible(true);
  };

  const confirmRemoveFriend = (): void => {
    if (friendToRemove) {
      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend.id !== friendToRemove.id));
      
      // Close modal and reset the selected friend
      setRemoveModalVisible(false);
      setFriendToRemove(null);
      
      // Show success message
      Alert.alert("Success", "Friend removed");
    }
  };

  const cancelRemoveFriend = (): void => {
    setRemoveModalVisible(false);
    setFriendToRemove(null);
  };

  // Rendering functions - properly typed
  const renderFriendItem = ({ item }: { item: Friend }): React.ReactElement => (
    <ThemedView style={styles.card}>
      <ThemedView style={styles.userInfo}>
        <ThemedText style={styles.userUsername}>{item.username}</ThemedText>
        <ThemedText style={styles.userName}>{item.name || "No name"}</ThemedText>
      </ThemedView>
      
      <TouchableOpacity
        style={[styles.iconButton, styles.removeButton]}
        onPress={() => promptRemoveFriend(item)}
      >
        <IconSymbol name="xmark" size={20} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );

  const renderRequestItem = ({ item }: { item: FriendRequest }): React.ReactElement => (
    <ThemedView style={styles.card}>
      <ThemedView style={styles.userInfo}>
        <ThemedText style={styles.userUsername}>{item.username}</ThemedText>
        <ThemedText style={styles.userName}>{item.name || "No name"}</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.iconButton, styles.acceptButton]}
          onPress={() => promptAcceptFriendRequest(item)}
        >
          <IconSymbol name="right" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.iconButton, styles.removeButton]}
          onPress={() => rejectFriendRequest(item.id)}
        >
          <IconSymbol name="xmark" size={20} color="white" />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
  
  const renderSearchResultItem = ({ item }: { item: User }): React.ReactElement => (
    <ThemedView style={styles.card}>
      <ThemedView style={styles.userInfo}>
        <ThemedText style={styles.userUsername}>{item.username}</ThemedText>
        <ThemedText style={styles.userName}>{item.name || "No name"}</ThemedText>
      </ThemedView>
      
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
      <ThemedText type="title" style={styles.title}>
        Friends
      </ThemedText>

      <ThemedView style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'friends' && [styles.activeTab, { borderBottomColor: tintColor }]
          ]}
          onPress={() => changeTab('friends')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'friends' && { color: tintColor, fontWeight: "bold" }
          ]}>
            My Friends
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'requests' && [styles.activeTab, { borderBottomColor: tintColor }]
          ]}
          onPress={() => changeTab('requests')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'requests' && { color: tintColor, fontWeight: "bold" }
          ]}>
            Requests {friendRequests.length > 0 ? `(${friendRequests.length})` : ''}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'search' && [styles.activeTab, { borderBottomColor: tintColor }]
          ]}
          onPress={() => changeTab('search')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'search' && { color: tintColor, fontWeight: "bold" }
          ]}>
            Add Friends
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {activeTab === 'search' && (
          <ThemedView style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { color: textColor, borderColor: textColor + '40' }]}
              placeholder="Search by name or username"
              placeholderTextColor={textColor + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={searchUsers}
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: tintColor }]}
              onPress={searchUsers}
              disabled={isLoading}
            >
              <IconSymbol name="magnifyingglass" size={20} color="white" />
            </TouchableOpacity>
          </ThemedView>
        )}

        {activeTab === 'friends' && (
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

        {activeTab === 'requests' && (
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

        {activeTab === 'search' && (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResultItem}
            keyExtractor={(item: User) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                {searchQuery ? "No users found" : "Search for users to add as friends"}
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
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginTop: 60,
    marginBottom: 30,
    textAlign: "center",
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
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
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 14,
    opacity: 0.7,
    color: '#2196F3',
    marginBottom: 3,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(33, 150, 243, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  removeButton: {
    backgroundColor: '#F44336',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.7,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  confirmButton: {
    // Uses tintColor passed via props
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  }
});