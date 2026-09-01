import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";


const AuthContext = createContext(null);


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

    api.defaults.headers.common.Authorization =
      `Bearer ${access}`;


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


    delete api.defaults.headers
      .common
      .Authorization;


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

    api.defaults.headers.common.Authorization =
      `Bearer ${token}`;


    // ----------------------------------------
    // Vérifier le token
    // ----------------------------------------

    api
      .get("/users/me/")

      .then((response) => {

        setUser(
          response.data
        );

      })

      .catch(() => {

        logout();

      })

      .finally(() => {

        setLoading(false);

      });

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