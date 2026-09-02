import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";


const AuthContext = createContext(null);


function setAuthorization(accessToken) {

  api.defaults.headers.common.Authorization =
    `Bearer ${accessToken}`;

}


function clearAuthorization() {

  delete api.defaults.headers.common.Authorization;

}


async function refreshAccessToken() {

  const refreshToken =
    localStorage.getItem(
      "refresh_token"
    );

  if (!refreshToken) {
    throw new Error("Jeton de rafraichissement absent.");
  }

  const response = await api.post(
    "/auth/refresh/",
    {
      refresh: refreshToken,
    }
  );

  const { access } = response.data;

  localStorage.setItem(
    "access_token",
    access
  );

  setAuthorization(access);

  return access;

}


export function AuthProvider({ children }) {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (
    username,
    password
  ) => {

    const response = await api.post(
      "/auth/login/",
      {
        username,
        password,
      }
    );


    const {
      access,
      refresh,
    } = response.data;


    // ----------------------------------------
    // STOCKAGE DES TOKENS
    // ----------------------------------------

    localStorage.setItem(
      "access_token",
      access
    );

    localStorage.setItem(
      "refresh_token",
      refresh
    );


    // ----------------------------------------
    // CONFIGURATION AXIOS
    // ----------------------------------------

    setAuthorization(access);


    // ----------------------------------------
    // RÉCUPÉRER L'UTILISATEUR
    // ----------------------------------------

    const userResponse =
      await api.get("/users/me/");


    const authenticatedUser =
      userResponse.data;


    setUser(
      authenticatedUser
    );


    // IMPORTANT :
    // Login.jsx utilise cette valeur
    // pour déterminer la redirection.

    return authenticatedUser;
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );


    clearAuthorization();


    setUser(null);
  };


  // ==========================================
  // RESTAURER LA SESSION
  // ==========================================

  useEffect(() => {

    const token =
      localStorage.getItem(
        "access_token"
      );


    // ----------------------------------------
    // Aucun token
    // ----------------------------------------

    if (!token) {

      setLoading(false);

      return;
    }


    // ----------------------------------------
    // Restaurer Authorization
    // ----------------------------------------

    setAuthorization(token);


    // ----------------------------------------
    // Vérifier le token
    // ----------------------------------------

    const restoreSession = async () => {

      try {

        const response = await api.get(
          "/users/me/"
        );

        setUser(response.data);

      } catch (error) {

        if (error.response?.status !== 401) {
          return;
        }

        try {

          await refreshAccessToken();

          const response = await api.get(
            "/users/me/"
          );

          setUser(response.data);

        } catch {

          logout();

        }

      } finally {

        setLoading(false);

      }

    };

    restoreSession();

  }, []);


  // ==========================================
  // CONTEXT
  // ==========================================

  return (

    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >

      {children}

    </AuthContext.Provider>

  );
}


// ============================================
// HOOK
// ============================================

export function useAuth() {

  return useContext(
    AuthContext
  );

}
