from channels.generic.websocket import AsyncJsonWebsocketConsumer


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