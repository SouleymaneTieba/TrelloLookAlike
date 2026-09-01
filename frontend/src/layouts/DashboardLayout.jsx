import {
  Bell,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  ShieldCheck,
  User,
  Users,
  UserCog,
} from "lucide-react";

import {
  NavLink,
  Outlet,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";

import NotificationDropdown from "../components/notifications/NotificationDropdown";


function DashboardLayout() {

  const {
    user,
    logout,
  } = useAuth();


  // ==================================================
  // ADMIN
  // ==================================================

  const isAdmin =
    Boolean(
      user?.is_staff ||
      user?.is_superuser
    );


  // ==================================================
  // NOTIFICATIONS
  // ==================================================

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const notificationSocket =
    useRef(null);


  // ==================================================
  // CHARGER LE NOMBRE DE NOTIFICATIONS NON LUES
  // ==================================================

  const fetchUnreadCount = useCallback(
    async () => {

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        return;
      }

      try {

        const response = await fetch(
          "http://127.0.0.1:8000/api/notifications/unread-count/",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        setUnreadCount(
          data.count || 0
        );

      } catch (error) {

        console.error(
          "Erreur compteur notifications :",
          error
        );

      }

    },
    []
  );


  // ==================================================
  // WEBSOCKET NOTIFICATIONS
  // ==================================================

  useEffect(() => {

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token || !user) {
      return;
    }


    // ------------------------------------------
    // COMPTEUR INITIAL
    // ------------------------------------------

    fetchUnreadCount();


    // ------------------------------------------
    // FERMER UNE ANCIENNE CONNEXION
    // ------------------------------------------

    if (
      notificationSocket.current
    ) {

      notificationSocket.current.close();

    }


    // ------------------------------------------
    // CONNEXION WEBSOCKET
    // ------------------------------------------

    const socket =
      new WebSocket(
        `ws://127.0.0.1:8000/ws/notifications/?token=${encodeURIComponent(token)}`
      );


    notificationSocket.current =
      socket;


    // ------------------------------------------
    // CONNEXION
    // ------------------------------------------

    socket.onopen = () => {

      console.log(
        "WebSocket notifications connecté"
      );

    };


    // ------------------------------------------
    // MESSAGE
    // ------------------------------------------

    socket.onmessage = (event) => {

      try {

        const notification =
          JSON.parse(
            event.data
          );

        console.log(
          "Nouvelle notification :",
          notification
        );


        // Si elle est non lue,
        // augmenter le compteur.

        if (
          !notification.is_read
        ) {

          setUnreadCount(
            (count) => count + 1
          );

        }

      } catch (error) {

        console.error(
          "Erreur notification WebSocket :",
          error
        );

      }

    };


    // ------------------------------------------
    // ERREUR
    // ------------------------------------------

    socket.onerror = (error) => {

      console.error(
        "Erreur WebSocket notifications :",
        error
      );

    };


    // ------------------------------------------
    // FERMETURE
    // ------------------------------------------

    socket.onclose = () => {

      console.log(
        "WebSocket notifications déconnecté"
      );

    };


    // ------------------------------------------
    // CLEANUP
    // ------------------------------------------

    return () => {

      socket.close();

      notificationSocket.current =
        null;

    };

  }, [
    user,
    fetchUnreadCount,
  ]);


  // ==================================================
  // NAVIGATION ADMIN
  // ==================================================

  const adminNavigation = [

    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },

    {
      name: "Utilisateurs",
      path: "/admin/users",
      icon: UserCog,
    },

    {
      name: "Équipes",
      path: "/admin/teams",
      icon: Users,
    },

    {
      name: "Projets",
      path: "/admin/projects",
      icon: FolderKanban,
    },

    {
      name: "Tâches",
      path: "/admin/tasks",
      icon: CheckSquare,
    },

  ];


  // ==================================================
  // NAVIGATION MEMBRE
  // ==================================================

  const memberNavigation = [

    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      name: "Mes tâches",
      path: "/tasks",
      icon: CheckSquare,
    },

    {
      name: "Projets",
      path: "/projects",
      icon: FolderKanban,
    },

    {
      name: "Équipe",
      path: "/teams",
      icon: Users,
    },

    {
      name: "Chat",
      path: "/chat",
      icon: MessageCircle,
    },

  ];


  const navigation =
    isAdmin
      ? adminNavigation
      : memberNavigation;


  // ==================================================
  // CLIQUER SUR LA CLOCHE
  // ==================================================

  const handleNotificationToggle =
    () => {

      setNotificationOpen(
        (current) => !current
      );

    };


  // ==================================================
  // FERMER LES NOTIFICATIONS
  // ==================================================

  const handleNotificationClose =
    () => {

      setNotificationOpen(false);

    };


  // ==================================================
  // COMPTEUR
  // ==================================================

  const handleUnreadCountChange =
    (value) => {

      if (
        typeof value === "function"
      ) {

        setUnreadCount(value);

      } else {

        setUnreadCount(value);

      }

    };


  // ==================================================
  // RENDER
  // ==================================================

  return (

    <div className="min-h-screen bg-[#0E171A] text-[#F1F5F2]">


      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#1C292D] bg-[#070D0F]">


        {/* LOGO */}

        <div className="flex h-20 items-center border-b border-[#1C292D] px-6">

          <div>

            <div className="flex items-center gap-2">

              {isAdmin && (

                <ShieldCheck
                  size={21}
                  className="text-[#B6FF00]"
                />

              )}

              <h1 className="text-2xl font-bold tracking-tight text-[#B6FF00]">
                Trell 
              </h1>

            </div>

            <p className="mt-0.5 text-xs text-[#647276]">

              {isAdmin
                ? "Back Office"
                : "Project Manager"}

            </p>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="flex-1 space-y-1 px-3 py-6">

          <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-[#47565A]">

            {isAdmin
              ? "Administration"
              : "Espace de travail"}

          </p>


          {navigation.map(
            (item) => {

              const Icon =
                item.icon;


              return (

                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#152400] text-[#B6FF00]"
                        : "text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
                    }`
                  }
                >

                  {({ isActive }) => (

                    <>

                      {isActive && (

                        <span className="absolute left-0 h-6 w-1 rounded-r-full bg-[#B6FF00]" />

                      )}

                      <Icon
                        size={20}
                        strokeWidth={
                          isActive
                            ? 2.2
                            : 1.8
                        }
                      />

                      <span>
                        {item.name}
                      </span>

                    </>

                  )}

                </NavLink>

              );

            }
          )}

        </nav>


        {/* ==================================================
            BOTTOM
        ================================================== */}

        <div className="border-t border-[#1C292D] px-3 py-4">

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#152400] text-[#B6FF00]"
                  : "text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
              }`
            }
          >

            <User size={20} />

            Profil

          </NavLink>


          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#152400] text-[#B6FF00]"
                  : "text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
              }`
            }
          >

            <Settings size={20} />

            Paramètres

          </NavLink>


          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-3 rounded-xl bg-[#152400] px-4 py-3 text-sm font-medium text-[#B6FF00] transition hover:bg-[#1D3200]"
          >

            <LogOut size={20} />

            Déconnexion

          </button>

        </div>

      </aside>


      {/* ==================================================
          MAIN
      ================================================== */}

      <div className="ml-64 min-h-screen">


        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#1C292D] bg-[#070D0F]/95 px-8 backdrop-blur">


          {/* LEFT */}

          <div>

            <p className="text-sm text-[#647276]">

              {isAdmin
                ? "Administration"
                : "Espace de travail"}

            </p>

            <p className="text-sm font-medium text-[#F1F5F2]">

              {isAdmin
                ? "Trell  Back Office"
                : "Trell  Project Manager"}

            </p>

          </div>


          {/* RIGHT */}

          <div className="flex items-center gap-5">


            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            <div className="relative">

              <button
                type="button"
                onClick={
                  handleNotificationToggle
                }
                className="relative rounded-xl p-2.5 text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
                title="Notifications"
              >

                <Bell
                  size={21}
                />


                {/* BADGE */}

                {unreadCount > 0 && (

                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#B6FF00] px-1 text-[10px] font-bold text-[#050A0C]">

                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}

                  </span>

                )}

              </button>


              {/* DROPDOWN */}

              <NotificationDropdown
                isOpen={
                  notificationOpen
                }
                onClose={
                  handleNotificationClose
                }
                onUnreadCountChange={
                  handleUnreadCountChange
                }
              />

            </div>


            {/* DIVIDER */}

            <div className="h-8 w-px bg-[#1C292D]" />


            {/* USER */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#152400] font-semibold text-[#B6FF00]">

                {user?.avatar ? (

                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />

                ) : (

                  user?.username
                    ?.charAt(0)
                    .toUpperCase()

                )}

              </div>


              <div className="hidden sm:block">

                <p className="text-sm font-medium text-[#F1F5F2]">

                  {user?.first_name ||
                    user?.username}

                </p>

                <p className="text-xs text-[#647276]">

                  {isAdmin
                    ? "Administrateur"
                    : user?.job_title ||
                      "Membre"}

                </p>

              </div>

            </div>

          </div>

        </header>


        {/* ==================================================
            CONTENT
        ================================================== */}

        <main className="p-8">

          <Outlet />

        </main>

      </div>

    </div>

  );

}


export default DashboardLayout;
