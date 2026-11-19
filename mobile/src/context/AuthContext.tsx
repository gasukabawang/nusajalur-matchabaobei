import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiService } from '../api/apiService';
import { setAuthToken, clearAuthToken, getAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const USER_STORAGE_KEY = '@nusajalur_cached_user';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCachedSession();
  }, []);

  const loadCachedSession = async () => {
    try {
      const savedToken = await getAuthToken();
      const savedUserStr = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (savedToken && savedUserStr) {
        setToken(savedToken);
        setUser(JSON.parse(savedUserStr));
      }
    } catch {
      // Ignore cache load failure
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await apiService.login(email, password);
    await setAuthToken(res.access_token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const loginDemo = async () => {
    await login('demo@nusajalur.id', 'demo1234');
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await apiService.register(email, password, fullName);
    await setAuthToken(res.access_token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = async () => {
    await clearAuthToken();
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginDemo,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
