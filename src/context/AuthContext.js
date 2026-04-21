import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then(async saved => {
      if (saved) {
        setTokenState(saved);
        try {
          const data = await authAPI.getMe(saved);
          setUser(data);
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setTokenState(null);
        }
      }
    });
  }, []);

  async function saveToken(jwtToken) {
    await SecureStore.setItemAsync(TOKEN_KEY, jwtToken);
    setTokenState(jwtToken);
  }

  async function login(email, password) {
    const data = await authAPI.login(email, password);
    await saveToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(name, email, password) {
    const data = await authAPI.register(name, email, password);
    await saveToken(data.token);
    setUser(data.user);
    return data;
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setTokenState(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
