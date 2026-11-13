import {
  Bell,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LogOut,
  UserRound,
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
import api, { getWebSocketUrl } from "../services/api";

import NotificationDropdown from "../components/notifications/NotificationDropdown";
import ThemeToggle from "../components/ThemeToggle";


function AdminLayout() {

  const {
    user,
    logout,
  } = useAuth();

  // ==================================================
  // NAVIGATION
  // ==================================================

  const navigation = [

    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },

    {
      name: "Utilisateurs",
      path: "/admin/users",
      icon: UserRound,
    },

    {
      name: "Projets",
      path: "/admin/projects",
      icon: FolderKanban,
    },

    {
      name: "GitLab",
      path: "/admin/gitlab",
      icon: GitBranch,
    },

  ];

  // ==================================================
  // NOTIFICATIONS
  // ==================================================

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);


  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);


  const notificationSocket =
    useRef(null);


  // ==================================================
  // COMPTEUR NON LUS
  // ==================================================

  const fetchUnreadCount = useCallback(
    async () => {
      try {
        const { data } = await api.get(
          "/notifications/unread-count/"
        );


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

    if (!user) {
      return;
    }


    const token =
      localStorage.getItem(
        "access_token"
      );


    if (!token) {
      return;
    }


    // ------------------------------------------
    // COMPTEUR INITIAL
    // ------------------------------------------

    fetchUnreadCount();


    // ------------------------------------------
    // FERMER ANCIEN SOCKET
    // ------------------------------------------

    if (
      notificationSocket.current
    ) {

      notificationSocket.current.close();

    }


    // ------------------------------------------
    // CRÉER LE SOCKET
    // ------------------------------------------

    const socket =
      new WebSocket(
        getWebSocketUrl(`/ws/notifications/?token=${encodeURIComponent(token)}`)
      );


    notificationSocket.current =
      socket;


    // ------------------------------------------
    // CONNECTION
    // ------------------------------------------

    socket.onopen = () => {

      console.log(
        "WebSocket Admin notifications connecté"
      );

    };


    // ------------------------------------------
    // NOUVELLE NOTIFICATION
    // ------------------------------------------

    socket.onmessage = (event) => {

      try {

        const notification =
          JSON.parse(
            event.data
          );

        window.dispatchEvent(
          new CustomEvent("app:notification-received", {
            detail: notification,
          })
        );

        console.log(
          "Nouvelle notification Admin :",
          notification
        );


        if (
          !notification.is_read
        ) {

          setUnreadCount(
            (currentCount) =>
              currentCount + 1
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
        "Erreur WebSocket notifications Admin :",
        error
      );

    };


    // ------------------------------------------
    // FERMETURE
    // ------------------------------------------

    socket.onclose = () => {

      console.log(
        "WebSocket Admin notifications déconnecté"
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
  // OUVRIR / FERMER DROPDOWN
  // ==================================================

  const toggleNotifications = () => {

    setNotificationOpen(
      (current) => !current
    );

  };


  const closeNotifications = () => {

    setNotificationOpen(false);

  };


  // ==================================================
  // MODIFIER COMPTEUR
  // ==================================================

  const handleUnreadCountChange = (
    value
  ) => {

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

        <div className="flex h-20 items-center border-b border-[#1C292D] px-5">
          <div>
            <img src="/orange-digital-center.svg" alt="Orange Digital Center" className="w-44 rounded-sm" />
            <p className="mt-1 text-[11px] text-[#647276]">Gestionnaire de tâches</p>
          </div>
        </div>


        {/* NAVIGATION */}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">

          {navigation.map(
            (item) => {
              const Icon =
                item.icon;


              return (

                <NavLink
                  key={item.path}
                  to={item.path}
                  end={
                    item.path === "/admin"
                  }
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


          {/* LOGOUT */}

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

            <p className="text-sm font-medium text-[#F1F5F2]">Administration</p>

          </div>


          {/* RIGHT */}

          <div className="flex items-center gap-5">

            <ThemeToggle />


            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            <div className="relative">

              <button
                type="button"
                onClick={
                  toggleNotifications
                }
                className="relative rounded-xl p-2.5 text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
                title="Notifications"
              >

                <Bell size={21} />


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
                  closeNotifications
                }
                onUnreadCountChange={
                  handleUnreadCountChange
                }
              />

            </div>


            {/* DIVIDER */}

            <div className="h-8 w-px bg-[#1C292D]" />


            {/* USER */}

            <div className="flex items-center gap-3 p-2">


              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#152400] font-semibold text-[#B6FF00]">

                {user?.username
                  ?.charAt(0)
                  .toUpperCase()}

              </div>


              <div className="hidden sm:block">

                <p className="text-sm font-medium text-[#F1F5F2]">

                  {user?.first_name ||
                    user?.username}

                </p>


                <p className="text-xs text-[#647276]">
                  Administrateur
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


export default AdminLayout;
