from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.users.presence import (
    mark_user_offline,
    mark_user_online,
)


class NotificationConsumer(
    AsyncJsonWebsocketConsumer
):

    async def connect(self):

        self.user = self.scope["user"]

        # ==========================================
        # AUTHENTIFICATION
        # ==========================================

        if (
            not self.user
            or not self.user.is_authenticated
        ):

            await self.close(
                code=4001
            )

            return

        mark_user_online(self.user.id)
        self.presence_registered = True

        # ==========================================
        # GROUPE PERSONNEL
        # ==========================================

        self.notification_group_name = (
            f"notifications_user_{self.user.id}"
        )

        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name,
        )

        await self.accept()

    async def disconnect(
        self,
        close_code,
    ):

        if hasattr(
            self,
            "notification_group_name",
        ):

            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name,
            )

        if getattr(self, "presence_registered", False):
            mark_user_offline(self.user.id)

    # ==========================================
    # NOTIFICATION REÇUE
    # ==========================================

    async def notification_message(
        self,
        event,
    ):

        await self.send_json(
            event["notification"]
        )