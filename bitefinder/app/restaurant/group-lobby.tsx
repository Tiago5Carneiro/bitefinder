import { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  StatusBar,
  View,
  TextInput,
  Clipboard,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

// Mock user data
const MOCK_USERS = [
  {
    id: "user1",
    name: "You",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
    status: "host", // host, ready, pending
  },
  {
    id: "user2",
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    status: "ready",
  },
  {
    id: "user3",
    name: "Sam Rodriguez",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    status: "ready",
  },
];

export default function GroupLobbyScreen() {
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");

  const [isLoading, setIsLoading] = useState(false);
  const [groupName, setGroupName] = useState("Dinner Squad");
  const [groupCode, setGroupCode] = useState("DIN-392-XYZ");
  const [members, setMembers] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Simulate sending invite
  const sendInvite = () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a username or email");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newMember = {
        id: `user${members.length + 1}`,
        name: searchQuery,
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200",
        status: "pending",
      };
      
      setMembers([...members, newMember]);
      setSearchQuery("");
      setIsLoading(false);
      
      Alert.alert("Success", `Invitation sent to ${searchQuery}`);
    }, 1500);
  };
  
  // Remove a member
  const removeMember = (userId: string) => {
    Alert.alert(
      "Remove Member",
      "Are you sure you want to remove this member?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            setMembers(members.filter(member => member.id !== userId));
          }
        }
      ]
    );
  };
  
  // Copy group code to clipboard
  const copyGroupCode = () => {
    Clipboard.setString(groupCode);
    Alert.alert("Success", "Group code copied to clipboard");
  };

  // Start the group selection process
  const startGroupSelection = () => {
    // Check if all members are ready
    const pendingMembers = members.filter(member => member.status === "pending");
    
    // Create a group object to pass to the selection screen
    const groupData = {
      id: groupCode,
      name: groupName,
      members: members.map(m => m.id),
    };
    
    if (pendingMembers.length > 0) {
      console.log("1", groupData);
      Alert.alert(
        "Pending Members",
        "Some members haven't joined yet. Do you want to start anyway?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Start Anyway", 
            onPress: () => {
              console.log("Navigating to group-selection with pending members:", groupData);
              router.push({
                pathname: "/restaurant/group-selection",
                params: { group: JSON.stringify(groupData) }
              });
            }
          }
        ]
      );
    } else {
      console.log("Directly navigating to group-selection:", groupData);
      router.push({
        pathname: "/restaurant/group-selection",
        params: { group: JSON.stringify(groupData) }
      });
    }
  };

  // Cancel the group session
  const cancelGroup = () => {
    Alert.alert(
      "Cancel Group",
      "Are you sure you want to cancel this dinner group?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          style: "destructive",
          onPress: () => router.back()
        }
      ]
    );
  };

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
            Dinner Group
          </ThemedText>
        </ThemedView>

        <TouchableOpacity onPress={cancelGroup} style={styles.cancelButton}>
          <Ionicons name="close-circle-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </ThemedView>
      
      {/* Group Info Card */}
      <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
        <ThemedView style={styles.groupNameContainer}>
          {isEditing ? (
            <TextInput
              style={[styles.groupNameInput, { color: textColor }]}
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
              onBlur={() => setIsEditing(false)}
              onSubmitEditing={() => setIsEditing(false)}
            />
          ) : (
            <TouchableOpacity 
              style={styles.groupNameRow}
              onPress={() => setIsEditing(true)}
            >
              <ThemedText type="title" style={styles.groupName}>
                {groupName}
              </ThemedText>
              <Ionicons name="pencil" size={16} color={textColor} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </ThemedView>
        
        <ThemedView style={styles.codeContainer}>
          <ThemedView style={styles.codeBox}>
            <ThemedText style={styles.codeText}>{groupCode}</ThemedText>
          </ThemedView>
          <TouchableOpacity style={styles.copyButton} onPress={copyGroupCode}>
            <Ionicons name="copy-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedText style={styles.codeHint}>
          Share this code with friends to join your dinner group
        </ThemedText>
      </ThemedView>
      
      {/* Member Invite */}
      <ThemedView style={styles.inviteSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Invite Friends
        </ThemedText>
        
        <ThemedView style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={textColor} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Username or email"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="send"
            onSubmitEditing={sendInvite}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: tintColor }]}
            onPress={sendInvite}
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
      
      {/* Members List */}
      <ThemedView style={styles.membersSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Members ({members.length})
        </ThemedText>
        
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemedView style={[styles.memberCard, { backgroundColor: cardColor }]}>
              <Image
                source={{ uri: item.avatar }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
              
              <ThemedView style={styles.memberInfo}>
                <ThemedText style={styles.memberName}>
                  {item.name}
                </ThemedText>
                
                <ThemedView style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: 
                      item.status === "host" ? "#4ECDC4" : 
                      item.status === "ready" ? "#4CAF50" : "#FFC107"
                  }
                ]}>
                  <ThemedText style={styles.statusText}>
                    {item.status === "host" ? "Host" : 
                     item.status === "ready" ? "Ready" : "Pending"}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              
              {item.id !== "user1" && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeMember(item.id)}
                >
                  <Ionicons name="person-remove" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </ThemedView>
          )}
          contentContainerStyle={styles.membersList}
        />
      </ThemedView>
      
      {/* Action Buttons */}
      <ThemedView style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: tintColor }]}
          onPress={startGroupSelection}
        >
          <Ionicons name="restaurant" size={20} color="#fff" style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText}>Start Restaurant Selection</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelGroupButton}
          onPress={cancelGroup}
        >
          <ThemedText style={[styles.cancelButtonText, { color: "#FF6B6B" }]}>
            Cancel Group
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
  groupNameContainer: {
    marginBottom: 16,
  },
  groupNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  groupNameInput: {
    fontSize: 24,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#4ECDC4",
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
    backgroundColor: "rgba(78, 205, 196, 0.1)",
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
    backgroundColor: "#4ECDC4",
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
    opacity: 0.7,
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
  removeButton: {
    padding: 8,
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
  cancelGroupButton: {
    alignItems: "center",
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});