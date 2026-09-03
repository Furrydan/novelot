import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { authApi } from "@api/novelClients";

export type User = {
  email: string;
};

type AuthContextValue = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const accessTokenRef = useRef<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.post("/login", { email, password });
      const accessToken = response.data.accessToken as string;
      accessTokenRef.current = accessToken;
      authApi.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      setUser({ email });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.post("/register", { email, password });
      const accessToken = response.data.accessToken as string;
      accessTokenRef.current = accessToken;
      authApi.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      setUser({ email });
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    isLoggedIn: user !== null,
    isLoading,
    login,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
