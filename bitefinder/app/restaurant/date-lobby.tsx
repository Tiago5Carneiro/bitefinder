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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

// Mock user data - just two for the date
const MOCK_USERS = [
  {
    id: "user1",
    name: "You",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
    status: "host", // host, ready, pending
  },
  {
    id: "user2",
    name: "Add your date",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    status: "pending",
  },
];

export default function DateLobbyScreen() {
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");

  const [isLoading, setIsLoading] = useState(false);
  const [dateName, setDateName] = useState("Romantic Evening");
  const [inviteCode, setInviteCode] = useState("DATE-392-XYZ");
  const [members, setMembers] = useState(MOCK_USERS);
  const [partnerName, setPartnerName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Function to invite partner
  const invitePartner = () => {
    if (!partnerName.trim()) {
      Alert.alert("Error", "Please enter your partner's name");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedMembers = [...members];
      updatedMembers[1] = {
        ...updatedMembers[1],
        name: partnerName,
        status: "pending"
      };
      
      setMembers(updatedMembers);
      setPartnerName("");
      setIsLoading(false);
      
      Alert.alert("Success", `Invitation sent to ${partnerName}`);
    }, 1000);
  };
  
  // Copy invite code to clipboard
  const copyInviteCode = () => {
    Clipboard.setString(inviteCode);
    Alert.alert("Success", "Invite code copied to clipboard");
  };
  
  // Start the date selection process
  const startDateSelection = () => {
    // Create a date object to pass to the selection screen
    const dateData = {
      id: inviteCode,
      name: dateName,
      members: members.map(m => m.id),
    };
    
    // If partner hasn't joined yet, show a confirmation dialog
    if (members[1].status === "pending" && members[1].name !== "Add your date") {
      Alert.alert(
        "Partner Pending",
        "Your partner hasn't joined yet. Do you want to start anyway?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Start Anyway", 
            onPress: () => {
              console.log("Navigating to group-selection with date data:", dateData);
              router.push({
                pathname: "/restaurant/group-selection",
                params: { group: JSON.stringify(dateData) }
              });
            }
          }
        ]
      );
    } else {
      console.log("Directly navigating to group-selection with date data:", dateData);
      router.push({
        pathname: "/restaurant/group-selection",
        params: { group: JSON.stringify(dateData) }
      });
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
          onPress: () => router.back()
        }
      ]
    );
  };

  // Simulate partner joining
  const simulatePartnerJoining = () => {
    if (members[1].status === "pending" && members[1].name !== "Add your date") {
      const updatedMembers = [...members];
      updatedMembers[1] = {
        ...updatedMembers[1],
        status: "ready"
      };
      
      setMembers(updatedMembers);
      Alert.alert("Partner Joined", `${members[1].name} has joined your date!`);
    }
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
              onPress={() => setIsEditing(true)}
            >
              <ThemedText type="title" style={styles.dateName}>
                {dateName}
              </ThemedText>
              <Ionicons name="pencil" size={16} color={textColor} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </ThemedView>
        
        <ThemedView style={styles.codeContainer}>
          <ThemedView style={styles.codeBox}>
            <ThemedText style={styles.codeText}>{inviteCode}</ThemedText>
          </ThemedView>
          <TouchableOpacity style={styles.copyButton} onPress={copyInviteCode}>
            <Ionicons name="copy-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedText style={styles.codeHint}>
          Share this code with your date partner
        </ThemedText>
      </ThemedView>
      
      {/* Partner Invite */}
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
      
      {/* Members Cards */}
      <ThemedView style={styles.membersSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Date Members
        </ThemedText>
        
        {/* Your card */}
        <ThemedView style={[styles.memberCard, { backgroundColor: cardColor }]}>
          <Image
            source={{ uri: members[0].avatar }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          
          <ThemedView style={styles.memberInfo}>
            <ThemedText style={styles.memberName}>
              {members[0].name}
            </ThemedText>
            
            <ThemedView style={[styles.statusBadge, { backgroundColor: "#4ECDC4" }]}>
              <ThemedText style={styles.statusText}>Host</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        {/* Partner card */}
        <ThemedView style={[styles.memberCard, { backgroundColor: cardColor }]}>
          <Image
            source={{ uri: members[1].avatar }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          
          <ThemedView style={styles.memberInfo}>
            <ThemedText style={styles.memberName}>
              {members[1].name}
            </ThemedText>
            
            <ThemedView style={[
              styles.statusBadge, 
              { backgroundColor: members[1].status === "ready" ? "#4CAF50" : "#FFC107" }
            ]}>
              <ThemedText style={styles.statusText}>
                {members[1].status === "ready" ? "Ready" : "Pending"}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          
          {members[1].name !== "Add your date" && members[1].status === "pending" && (
            <TouchableOpacity 
              style={styles.reminderButton}
              onPress={simulatePartnerJoining}
            >
              <Ionicons name="reload" size={18} color="#4ECDC4" />
              <ThemedText style={styles.reminderText}>Check</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>
      
      {/* Action Buttons */}
      <ThemedView style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: "#FF6B9D" }]}
          onPress={startDateSelection}
        >
          <Ionicons name="heart" size={20} color="#fff" style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText}>Find Restaurant Together</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelDateButton}
          onPress={cancelDate}
        >
          <ThemedText style={[styles.cancelButtonText, { color: "#FF6B6B" }]}>
            Cancel Date
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