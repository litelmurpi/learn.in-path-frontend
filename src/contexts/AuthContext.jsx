/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Validate token dengan API
          api
            .get("/user")
            .then((response) => {
              if (response.data.id !== parsedUser.id) {
                setUser(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
              }
            })
            .catch(() => {
              // Token invalid
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setUser(null);
            });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post("/login", { email, password });
      const { user, token } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(
    async (name, email, password, password_confirmation) => {
      try {
        const response = await api.post("/register", {
          name,
          email,
          password,
          password_confirmation,
        });
        const { user, token } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);

        toast.success("Registration successful!");
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || "Registration failed";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      toast.success("Logged out successfully");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      loading,
    }),
    [user, login, register, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
