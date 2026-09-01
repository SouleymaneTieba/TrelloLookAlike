import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function AdminRoute({ children }) {

  const {
    user,
    loading,
  } = useAuth();


  // Authentification encore en cours

  if (loading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050A0C]">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1C292D] border-t-[#B6FF00]" />

          <p className="mt-4 text-sm text-[#647276]">
            Vérification des accès...
          </p>

        </div>

      </div>
    );

  }


  // Pas connecté

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // Pas administrateur

  if (
    !user.is_staff &&
    !user.is_superuser
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  return children;

}


export default AdminRoute;