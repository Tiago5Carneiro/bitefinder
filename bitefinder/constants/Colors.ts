/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#1A1A2E", // Dark blue-black for text
    background: "#FFFFFF", // White background
    tint: "#FF6B6B", // Vibrant coral/red for primary actions
    icon: "#4E4E4E", // Dark gray for icons
    tabIconDefault: "#CCCCCC", // Light gray for inactive tabs
    tabIconSelected: "#FF6B6B", // Match tint color for selected tabs
    card: "#F8F9FA", // Light gray for cards
    border: "#E0E0E0", // Light border color
    notification: "#FF3B30", // Red for notifications
    secondary: "#4ECDC4", // Teal for secondary elements
  },
  dark: {
    text: "#F7F7F7", // Off-white for text
    background: "#121212", // Dark background
    tint: "#FF6B6B", // Same coral/red for consistency
    icon: "#C7C7C7", // Light gray for icons
    tabIconDefault: "#6E6E6E", // Medium gray for inactive tabs
    tabIconSelected: "#FF6B6B", // Match tint color for selected tabs
    card: "#1E1E1E", // Slightly lighter than background for cards
    border: "#2C2C2C", // Dark border color
    notification: "#FF453A", // Red for notifications
    secondary: "#4ECDC4", // Teal for secondary elements
  },
};
