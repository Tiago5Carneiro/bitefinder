import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { router } from "expo-router";
// For a real app, you would use SecureStore to store tokens
// import * as SecureStore from 'expo-secure-store';

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    // Check if token exists in storage
    const loadToken = async () => {
      try {
        // In a real app, retrieve token from SecureStore
        // const token = await SecureStore.getItemAsync('userToken');
        const token = null; // Simulate no token for now

        if (token) {
          // If token exists, fetch user data
          // const userData = await fetchUserData(token);
          // setUser(userData);
          // For demo purposes
          setUser({
            id: "1",
            name: "Demo User",
            email: "user@example.com",
          });
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
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Make API request to sign in
      // const response = await api.post('/login', { email, password });
      // const { token, user } = response.data;

      // For demo purposes
      const user = {
        id: "1",
        name: "Demo User",
        email: email,
      };

      // Store token
      // await SecureStore.setItemAsync('userToken', token);

      // Update state
      setUser(user);

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Sign in failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Make API request to register
      // const response = await api.post('/register', { name, email, password });
      console.log("Registered user:", { name, email });

      // Usually you would redirect to login or automatically sign in the user
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Sign up failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Clear token from storage
      // await SecureStore.deleteItemAsync('userToken');

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
