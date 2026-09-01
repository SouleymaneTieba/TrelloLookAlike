from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification


class NotificationService:

    # ==================================================
    # ENVOYER EN TEMPS RÉEL
    # ==================================================

    @staticmethod
    def broadcast(notification):

        channel_layer = get_channel_layer()

        if not channel_layer:
            return

        group_name = (
            f"notifications_user_{notification.user_id}"
        )

        async_to_sync(
            channel_layer.group_send
        )(
            group_name,
            {
                "type": "notification_message",

                "notification": {
                    "id": notification.id,
                    "notification_type": (
                        notification.notification_type
                    ),
                    "title": notification.title,
                    "message": notification.message,
                    "link": notification.link,
                    "is_read": notification.is_read,
                    "created_at": (
                        notification.created_at
                        .isoformat()
                    ),
                },
            },
        )

    # ==================================================
    # NOTIFICATION POUR UN UTILISATEUR
    # ==================================================

    @staticmethod
    def create(
        *,
        user,
        notification_type,
        title,
        message,
        link="",
    ):

        notification = (
            Notification.objects.create(

                user=user,

                notification_type=(
                    notification_type
                ),

                title=title,

                message=message,

                link=link,

            )
        )

        # ------------------------------------------
        # TEMPS RÉEL
        # ------------------------------------------

        NotificationService.broadcast(
            notification
        )

        return notification

    # ==================================================
    # NOTIFICATION POUR PLUSIEURS UTILISATEURS
    # ==================================================

    @staticmethod
    def create_for_users(
        *,
        users,
        notification_type,
        title,
        message,
        link="",
        exclude_user=None,
    ):

        notifications = []

        for user in users:

            if (
                exclude_user
                and user.id == exclude_user.id
            ):
                continue

            notifications.append(
                Notification(

                    user=user,

                    notification_type=(
                        notification_type
                    ),

                    title=title,

                    message=message,

                    link=link,

                )
            )

        if not notifications:
            return []

        Notification.objects.bulk_create(
            notifications
        )

        # ------------------------------------------
        # TEMPS RÉEL
        # ------------------------------------------

        for notification in notifications:

            NotificationService.broadcast(
                notification
            )

        return notifications

    # ==================================================
    # NOTIFICATION AUX MEMBRES D'UNE ÉQUIPE
    # ==================================================

    @staticmethod
    def create_for_team_members(
        *,
        team,
        notification_type,
        title,
        message,
        link="",
        exclude_user=None,
    ):

        users = (
            team.members
            .filter(
                is_active=True,
            )
            .values_list(
                "user",
                flat=True,
            )
        )

        notifications = []

        for user_id in users:

            if (
                exclude_user
                and user_id == exclude_user.id
            ):
                continue

            notifications.append(
                Notification(

                    user_id=user_id,

                    notification_type=(
                        notification_type
                    ),

                    title=title,

                    message=message,

                    link=link,

                )
            )

        if not notifications:
            return []

        Notification.objects.bulk_create(
            notifications
        )

        # ------------------------------------------
        # TEMPS RÉEL
        # ------------------------------------------

        for notification in notifications:

            NotificationService.broadcast(
                notification
            )

        return notifications