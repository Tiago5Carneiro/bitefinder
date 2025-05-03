import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:5000/";

type User = {
  username: string;
  name: string;
  email: string;
  food_preferences: string[];
  place_preferences: string[];
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (
    username: string,
    name: string,
    email: string,
    password: string,
    food_preferences: string[],
    place_preferences: string[]
  ) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const userDataString = await AsyncStorage.getItem("userData");

        if (token && userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to load auth token", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  // Sign in function
  const signIn = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();
      console.log(data);

      // Store token and user data
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.user));

      // Update state
      setUser(data.user);

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Sign in failed", error);
      throw new Error(error.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (
    username: string,
    name: string,
    email: string,
    password: string,
    place_preferences: string[],
    food_preferences: string[]
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          name,
          email,
          password,
          place_preferences,
          food_preferences,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      // Redirect to login
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.error("Sign up failed", error);
      throw new Error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Clear tokens from storage
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");

      // Update state
      setUser(null);

      // Navigate to auth screen
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for easy access to the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
