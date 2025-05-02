<<<<<<< Updated upstream
import { StyleSheet, TouchableOpacity, TextInput, Alert, Modal, View, ScrollView, Image } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
=======
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  View,
} from "react-native";
import { useState } from "react";
>>>>>>> Stashed changes

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for recent restaurants
const RECENT_RESTAURANTS = [
  {
    id: "1",
    name: "Sushi Paradise",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200",
    date: "Apr 28, 2025",
    rating: 4.5
  },
  {
    id: "2",
    name: "Burger Joint",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200",
    date: "Apr 22, 2025",
    rating: 4.2
  },
  {
    id: "3",
    name: "Pasta Palace",
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=200",
    date: "Apr 15, 2025",
    rating: 4.7
  },
  {
    id: "4",
    name: "Taco Fiesta",
    image: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=200",
    date: "Apr 8, 2025",
    rating: 4.1
  },
  {
    id: "5",
    name: "Golden Dragon",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200",
    date: "Apr 3, 2025",
    rating: 4.3
  }
];

// Additional restaurants for expanded view
const ADDITIONAL_RESTAURANTS = [
  {
    id: "6",
    name: "Mountain View Cafe",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200",
    date: "Mar 25, 2025",
    rating: 4.4
  },
  {
    id: "7",
    name: "Coastal Seafood",
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=200",
    date: "Mar 18, 2025",
    rating: 4.6
  },
  {
    id: "8",
    name: "Thai Spice",
    image: "https://images.unsplash.com/photo-1562565652-a0d8b4be2115?w=200",
    date: "Mar 10, 2025",
    rating: 4.3
  },
  {
    id: "9",
    name: "Mediterranean Delight",
    image: "https://images.unsplash.com/photo-1594179047519-f347310d3322?w=200",
    date: "Mar 3, 2025",
    rating: 4.7
  },
  {
    id: "10",
    name: "Rustic Kitchen",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200",
    date: "Feb 24, 2025",
    rating: 4.2
  }
];

// Mock data for friend rankings
const FRIEND_RANKINGS = [
  {
    id: "1",
    name: "Alex Johnson",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    count: 8,
    lastDate: "Apr 28, 2025"
  },
  {
    id: "2",
    name: "Sam Rodriguez",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    count: 5,
    lastDate: "Apr 15, 2025"
  },
  {
    id: "3",
    name: "Taylor Kim",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    count: 3,
    lastDate: "Apr 3, 2025"
  }
];

// Additional friends for expanded view
const ADDITIONAL_FRIENDS = [
  {
    id: "4",
    name: "Jordan Smith",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    count: 2,
    lastDate: "Mar 18, 2025"
  },
  {
    id: "5",
    name: "Casey Morgan",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    count: 2,
    lastDate: "Mar 10, 2025"
  },
  {
    id: "6",
    name: "Riley Wilson",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    count: 1,
    lastDate: "Feb 24, 2025"
  },
  {
    id: "7",
    name: "Jamie Taylor",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
    count: 1,
    lastDate: "Jan 15, 2025"
  }
];

// Mock extended user data
const EXTENDED_USER_DATA = {
  name: "Demo User",
  email: "demo@example.com",
  avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
  phone: "+1 (555) 123-4567",
  dietaryPreferences: "Vegetarian, No peanuts"
};

export default function ProfileScreen() {
  // State for showing all items
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);
  const [showAllFriends, setShowAllFriends] = useState(false);
  
  // Authentication and user context
  const { user, signOut } = useAuth();

  // Theme colors
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const modalBackgroundColor = useThemeColor({}, "background");
  
  // Enhance user with mock data if properties are missing
  const enhancedUser = user ? {
    ...user,
    name: EXTENDED_USER_DATA.name,
    email: EXTENDED_USER_DATA.email,
    avatar: EXTENDED_USER_DATA.avatar,
    phone: EXTENDED_USER_DATA.phone,
    dietaryPreferences: EXTENDED_USER_DATA.dietaryPreferences
  } : EXTENDED_USER_DATA;

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(enhancedUser?.name || "");
  const [email, setEmail] = useState(enhancedUser?.email || "");
  const [phone, setPhone] = useState(enhancedUser?.phone || "");
  const [dietaryPreferences, setDietaryPreferences] = useState(enhancedUser?.dietaryPreferences || "");
  const [activeTab, setActiveTab] = useState("restaurants"); // restaurants or friends

  // Update form fields when user changes
  useEffect(() => {
    if (enhancedUser) {
      setName(enhancedUser.name || "");
      setEmail(enhancedUser.email || "");
      setPhone(enhancedUser.phone || "");
      setDietaryPreferences(enhancedUser.dietaryPreferences || "");
    }
  }, [enhancedUser]);

  // Handle profile update
  const handleSave = async () => {
    try {
      // Here you would update the user profile in your backend
      // await updateUserProfile({ name, email, phone, dietaryPreferences });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // Cancel profile edit
  const handleCancel = () => {
    setName(enhancedUser?.name || "");
    setEmail(enhancedUser?.email || "");
    setPhone(enhancedUser?.phone || "");
    setDietaryPreferences(enhancedUser?.dietaryPreferences || "");
    setIsEditing(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header with Background */}
        <LinearGradient
          colors={[tintColor, `${tintColor}80`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: enhancedUser.avatar
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editImageButton}>
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <ThemedText style={styles.headerName}>
            {enhancedUser.name || "User Name"}
          </ThemedText>
          <ThemedText style={styles.headerEmail}>
            {enhancedUser.email || "user@example.com"}
          </ThemedText>
        </LinearGradient>

        {/* Profile Information Card */}
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              My Profile
            </ThemedText>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setIsEditing(true)}
            >
              <LinearGradient
                colors={[tintColor, `${tintColor}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.editButtonGradient}
              >
                <Ionicons name="pencil" size={16} color="white" />
                <ThemedText style={styles.editProfileButtonText}>
                  Edit
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={textColor} style={styles.infoIcon} />
            <ThemedText style={styles.infoLabel}>Name</ThemedText>
            <ThemedText style={styles.infoValue}>{enhancedUser.name || "N/A"}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={textColor} style={styles.infoIcon} />
            <ThemedText style={styles.infoLabel}>Email</ThemedText>
            <ThemedText style={styles.infoValue}>{enhancedUser.email || "N/A"}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={textColor} style={styles.infoIcon} />
            <ThemedText style={styles.infoLabel}>Phone</ThemedText>
            <ThemedText style={styles.infoValue}>{enhancedUser.phone || "N/A"}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="restaurant-outline" size={20} color={textColor} style={styles.infoIcon} />
            <ThemedText style={styles.infoLabel}>Preferences</ThemedText>
            <ThemedText style={styles.infoValue}>{enhancedUser.dietaryPreferences || "None"}</ThemedText>
          </View>
        </ThemedView>

        {/* History Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === "restaurants" && [styles.activeTab, { borderColor: tintColor }]
            ]}
            onPress={() => setActiveTab("restaurants")}
          >
            <Ionicons 
              name="restaurant" 
              size={18} 
              color={activeTab === "restaurants" ? tintColor : textColor} 
            />
            <ThemedText 
              style={[
                styles.tabText, 
                activeTab === "restaurants" && { color: tintColor, fontWeight: '600' }
              ]}
            >
              Recent Restaurants
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === "friends" && [styles.activeTab, { borderColor: tintColor }]
            ]}
            onPress={() => setActiveTab("friends")}
          >
            <Ionicons 
              name="people" 
              size={18} 
              color={activeTab === "friends" ? tintColor : textColor} 
            />
            <ThemedText 
              style={[
                styles.tabText, 
                activeTab === "friends" && { color: tintColor, fontWeight: '600' }
              ]}
            >
              Dining Buddies
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Recent Restaurants List */}
        {activeTab === "restaurants" && (
          <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Your Recent Spots
            </ThemedText>
            
            {/* Show either the initial list or the full list based on state */}
            {(showAllRestaurants 
              ? [...RECENT_RESTAURANTS, ...ADDITIONAL_RESTAURANTS] 
              : RECENT_RESTAURANTS
            ).map(restaurant => (
              <TouchableOpacity key={restaurant.id} style={styles.restaurantItem}>
                <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
                <View style={styles.restaurantInfo}>
                  <ThemedText style={styles.restaurantName}>{restaurant.name}</ThemedText>
                  <ThemedText style={styles.restaurantDate}>{restaurant.date}</ThemedText>
                </View>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <ThemedText style={styles.rating}>{restaurant.rating}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllRestaurants(!showAllRestaurants)}
            >
              <ThemedText style={[styles.viewAllText, { color: tintColor }]}>
                {showAllRestaurants ? "Show Less" : "View All History"}
              </ThemedText>
              <Ionicons 
                name={showAllRestaurants ? "chevron-up" : "chevron-forward"} 
                size={16} 
                color={tintColor} 
              />
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Friends Ranking List */}
        {activeTab === "friends" && (
          <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Your Dining Buddies
            </ThemedText>
            
            {/* Show either the initial list or the full list based on state */}
            {(showAllFriends 
              ? [...FRIEND_RANKINGS, ...ADDITIONAL_FRIENDS] 
              : FRIEND_RANKINGS
            ).map((friend, index) => (
              <TouchableOpacity key={friend.id} style={styles.friendItem}>
                <ThemedText style={styles.friendRank}>#{index + 1}</ThemedText>
                <Image source={{ uri: friend.image }} style={styles.friendImage} />
                <View style={styles.friendInfo}>
                  <ThemedText style={styles.friendName}>{friend.name}</ThemedText>
                  <ThemedText style={styles.friendDate}>Last: {friend.lastDate}</ThemedText>
                </View>
                <View style={styles.countContainer}>
                  <ThemedText style={styles.count}>{friend.count}</ThemedText>
                  <ThemedText style={styles.countLabel}>meals</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllFriends(!showAllFriends)}
            >
              <ThemedText style={[styles.viewAllText, { color: tintColor }]}>
                {showAllFriends ? "Show Less" : "See All Friends"}
              </ThemedText>
              <Ionicons 
                name={showAllFriends ? "chevron-up" : "chevron-forward"} 
                size={16} 
                color={tintColor} 
              />
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: "#FF6B6B" }]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditing}
        onRequestClose={() => setIsEditing(false)}
      >
        {/* Modal Background Overlay */}
        <View style={styles.modalOverlay}>
          {/* Modal Content Container */}
          <View style={[styles.modalContent, { backgroundColor: modalBackgroundColor }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={24} color={textColor} />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.modalTitle}>
                Edit Profile
              </ThemedText>
              <View style={{ width: 24 }} /> {/* Spacer for symmetry */}
            </View>
            
            {/* Modal Fields */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Image Edit */}
              <View style={styles.modalImageContainer}>
                <Image
                  source={{
                    uri: enhancedUser.avatar
                  }}
                  style={styles.modalProfileImage}
                />
                <TouchableOpacity style={styles.modalImageEditButton}>
                  <LinearGradient
                    colors={[tintColor, `${tintColor}CC`]}
                    style={styles.modalImageEditGradient}
                  >
                    <Ionicons name="camera" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              {/* Form Fields */}
              <View style={styles.formField}>
                <View style={styles.labelRow}>
                  <Ionicons name="person-outline" size={18} color={textColor} style={{ marginRight: 6 }} />
                  <ThemedText type="subtitle">Name</ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: cardColor, color: textColor }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.formField}>
                <View style={styles.labelRow}>
                  <Ionicons name="mail-outline" size={18} color={textColor} style={{ marginRight: 6 }} />
                  <ThemedText type="subtitle">Email</ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: cardColor, color: textColor }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.formField}>
                <View style={styles.labelRow}>
                  <Ionicons name="call-outline" size={18} color={textColor} style={{ marginRight: 6 }} />
                  <ThemedText type="subtitle">Phone</ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: cardColor, color: textColor }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.formField}>
                <View style={styles.labelRow}>
                  <Ionicons name="restaurant-outline" size={18} color={textColor} style={{ marginRight: 6 }} />
                  <ThemedText type="subtitle">Dietary Preferences</ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: cardColor, color: textColor }]}
                  value={dietaryPreferences}
                  onChangeText={setDietaryPreferences}
                  placeholder="E.g., Vegetarian, Gluten-free, etc."
                  placeholderTextColor="#888"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={[tintColor, `${tintColor}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 8 }} />
                  <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 80,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "white",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4ECDC4",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  headerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  headerEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  editProfileButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  editButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    marginLeft: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
  },
  restaurantItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  restaurantDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "bold",
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  friendRank: {
    width: 30,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  friendDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  countContainer: {
    alignItems: "center",
  },
  count: {
    fontSize: 18,
    fontWeight: "bold",
  },
  countLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FF6B6B",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    textAlign: "center",
  },
  modalImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  modalImageEditButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    borderRadius: 18,
    overflow: "hidden",
  },
  modalImageEditGradient: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  formField: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});
