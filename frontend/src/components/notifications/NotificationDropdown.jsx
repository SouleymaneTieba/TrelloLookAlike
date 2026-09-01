import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";


function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
}) {

  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==================================================
  // CHARGER LES NOTIFICATIONS
  // ==================================================

  useEffect(() => {

    if (!isOpen) {
      return;
    }

    const fetchNotifications = async () => {

      try {

        setLoading(true);
        setError("");

        const response = await api.get(
          "/notifications/"
        );

        setNotifications(
          response.data
        );

      } catch (error) {

        console.error(error);

        setError(
          "Impossible de charger les notifications."
        );

      } finally {

        setLoading(false);

      }

    };

    fetchNotifications();

  }, [isOpen]);


  // ==================================================
  // MARQUER UNE NOTIFICATION COMME LUE
  // ==================================================

  const markAsRead = async (
    notification
  ) => {

    if (notification.is_read) {
      return;
    }

    try {

      await api.post(
        `/notifications/${notification.id}/read/`
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (item) =>
              item.id === notification.id
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
          )
      );

      onUnreadCountChange?.(
        (count) => Math.max(count - 1, 0)
      );

    } catch (error) {

      console.error(
        "Erreur lors du marquage :",
        error
      );

    }

  };


  // ==================================================
  // TOUT MARQUER COMME LU
  // ==================================================

  const markAllAsRead = async () => {

    try {

      await api.post(
        "/notifications/read-all/"
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (item) => ({
              ...item,
              is_read: true,
            })
          )
      );

      onUnreadCountChange?.(
        0
      );

    } catch (error) {

      console.error(
        "Erreur lors du marquage global :",
        error
      );

    }

  };


  // ==================================================
  // CLIQUER SUR UNE NOTIFICATION
  // ==================================================

  const handleNotificationClick = async (
    notification
  ) => {

    await markAsRead(
      notification
    );

    onClose();

    if (notification.link) {

      navigate(
        notification.link
      );

    }

  };


  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (
    date
  ) => {

    const notificationDate =
      new Date(date);

    const now =
      new Date();

    const difference =
      Math.floor(
        (now - notificationDate) /
          1000
      );


    if (difference < 60) {
      return "À l'instant";
    }


    if (difference < 3600) {

      return `Il y a ${Math.floor(
        difference / 60
      )} min`;

    }


    if (difference < 86400) {

      return `Il y a ${Math.floor(
        difference / 3600
      )} h`;

    }


    return notificationDate.toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
      }
    );

  };


  // ==================================================
  // SI FERMÉ
  // ==================================================

  if (!isOpen) {
    return null;
  }


  return (

    <div className="absolute right-0 top-14 z-50 w-[390px] overflow-hidden rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex items-center justify-between border-b border-[#1C292D] px-5 py-4">

        <div>

          <h3 className="font-semibold text-[#F1F5F2]">
            Notifications
          </h3>

          <p className="mt-0.5 text-xs text-[#647276]">
            Vos dernières notifications
          </p>

        </div>


        {notifications.some(
          (notification) =>
            !notification.is_read
        ) && (

          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs font-medium text-[#B6FF00] transition hover:text-[#C4FF33]"
          >

            <CheckCheck size={14} />

            Tout lire

          </button>

        )}

      </div>


      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="max-h-[450px] overflow-y-auto">


        {loading ? (

          <div className="px-5 py-10 text-center">

            <p className="text-sm text-[#647276]">
              Chargement...
            </p>

          </div>

        ) : error ? (

          <div className="px-5 py-10 text-center">

            <p className="text-sm text-red-400">
              {error}
            </p>

          </div>

        ) : notifications.length === 0 ? (

          <div className="px-5 py-12 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#10191C]">

              <Bell
                size={22}
                className="text-[#47565A]"
              />

            </div>

            <p className="mt-4 text-sm font-medium text-[#94A3A6]">
              Aucune notification
            </p>

            <p className="mt-1 text-xs text-[#647276]">
              Vous êtes à jour.
            </p>

          </div>

        ) : (

          <div>

            {notifications.map(
              (notification) => (

                <button
                  key={notification.id}
                  type="button"
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                  className={`group flex w-full gap-3 border-b border-[#1C292D] px-5 py-4 text-left transition hover:bg-[#10191C] ${
                    notification.is_read
                      ? ""
                      : "bg-[#0D1708]"
                  }`}
                >

                  {/* Indicator */}

                  <div className="pt-1">

                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${
                        notification.is_read
                          ? "bg-[#47565A]"
                          : "bg-[#B6FF00]"
                      }`}
                    />

                  </div>


                  {/* Icon */}

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#152400]">

                    <Bell
                      size={16}
                      className="text-[#B6FF00]"
                    />

                  </div>


                  {/* Text */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-2">

                      <p
                        className={`text-sm ${
                          notification.is_read
                            ? "font-medium text-[#94A3A6]"
                            : "font-semibold text-[#F1F5F2]"
                        }`}
                      >

                        {notification.title}

                      </p>

                      {!notification.is_read && (

                        <Check
                          size={14}
                          className="shrink-0 text-[#B6FF00]"
                        />

                      )}

                    </div>


                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#647276]">

                      {notification.message}

                    </p>


                    <div className="mt-2 flex items-center gap-2">

                      <span className="text-[10px] text-[#47565A]">

                        {formatDate(
                          notification.created_at
                        )}

                      </span>


                      {notification.link && (

                        <ExternalLink
                          size={11}
                          className="text-[#47565A]"
                        />

                      )}

                    </div>

                  </div>

                </button>

              )
            )}

          </div>

        )}

      </div>


      {/* ==================================================
          FOOTER
      ================================================== */}

      {notifications.length > 0 && (

        <div className="border-t border-[#1C292D] px-5 py-3">

          <p className="text-center text-[10px] text-[#47565A]">
            Les notifications sont mises à jour automatiquement.
          </p>

        </div>

      )}

    </div>

  );

}


export default NotificationDropdown;