import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminUsers from "../pages/admin/Users";
import AdminTeams from "../pages/admin/Teams";
import AdminTasks from "../pages/admin/Tasks";
import AdminAvailability from "../pages/admin/Availability";
import AdminProjects from "../pages/admin/Projects";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Projects from "../pages/Projects";
import Chat from "../pages/Chat";
import Teams from "../pages/Teams";

import Dashboard from "../pages/Dashboard";
import Tasks from "../pages/Tasks";
import Availability from "../pages/Availability";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

import DashboardLayout from "../layouts/DashboardLayout";
import AdminLayout from "../layouts/AdminLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";


function Placeholder({ title }) {

  return (

    <div>

      <h1 className="text-2xl font-bold text-[#F1F5F2]">
        {title}
      </h1>

      <p className="mt-2 text-[#647276]">
        Cette section sera bientôt disponible.
      </p>

    </div>

  );

}


function AppRouter() {

  return (

    <BrowserRouter>

      <Routes>


        {/* ======================================
            PUBLIC
        ======================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ======================================
            ESPACE UTILISATEUR
        ======================================= */}

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/tasks"
            element={<Tasks />}
          />

          <Route
            path="/availability"
            element={<Availability />}
          />

          <Route
            path="/projects"
            element={<Projects />}
          />

          <Route
            path="/teams"
            element={<Teams />}
          />

          <Route
            path="/notifications"
            element={
              <Placeholder
                title="Notifications"
              />
            }
          />

          <Route
            path="/chat"
            element={<Chat />}
          />

          <Route
            path="/profile"
            element={
              <Placeholder
                title="Profil"
              />
            }
          />

          <Route
            path="/settings"
            element={
              <Placeholder
                title="Paramètres"
              />
            }
          />

        </Route>


        {/* ======================================
            BACK OFFICE ADMIN
        ======================================= */}

        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >

          {/* Dashboard admin */}

          <Route
            path="/admin"
            element={
              <AdminDashboard />
            }
          />


          {/* Utilisateurs */}

          <Route
            path="/admin/users"
            element={<AdminUsers />}
          />


          {/* Équipes */}

          <Route
            path="/admin/teams"
            element={<AdminTeams />}
          />


          {/* Projets */}

          <Route
            path="/admin/projects"
            element={<AdminProjects />}
          />


          {/* Tâches */}

          <Route
            path="/admin/tasks"
            element={<AdminTasks />}
          />


          {/* Disponibilités */}

          <Route
            path="/admin/availability"
            element={<AdminAvailability />}
          />


          {/* Notifications */}

          <Route
            path="/admin/notifications"
            element={
              <Placeholder
                title="Notifications"
              />
            }
          />


          {/* Settings */}

          <Route
            path="/admin/settings"
            element={
              <Placeholder
                title="Paramètres"
              />
            }
          />

        </Route>


        {/* ======================================
            DEFAULT
        ======================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* ======================================
            404
        ======================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );

}


export default AppRouter;