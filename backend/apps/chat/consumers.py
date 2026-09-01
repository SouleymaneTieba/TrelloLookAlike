from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.teams.models import Team, TeamMember

from .models import Message


class ChatConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):

        self.team_id = self.scope["url_route"]["kwargs"][
            "team_id"
        ]

        self.room_group_name = (
            f"chat_team_{self.team_id}"
        )

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
        # VÉRIFIER L'ÉQUIPE
        # ==========================================

        is_allowed = await self.user_can_access_team(
            self.team_id
        )

        if not is_allowed:

            await self.close(
                code=4003
            )

            return

        # ==========================================
        # REJOINDRE LE GROUPE
        # ==========================================

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )

        await self.accept()

    async def disconnect(self, close_code):

        if hasattr(
            self,
            "room_group_name",
        ):

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )

    async def receive_json(
        self,
        content,
        **kwargs,
    ):

        message_content = content.get(
            "content",
            "",
        )

        message_content = message_content.strip()

        if not message_content:

            return

        # ==========================================
        # SAUVEGARDER LE MESSAGE
        # ==========================================

        message = await self.create_message(
            team_id=self.team_id,
            user=self.user,
            content=message_content,
        )

        # ==========================================
        # DIFFUSER LE MESSAGE
        # ==========================================

        await self.channel_layer.group_send(

            self.room_group_name,

            {
                "type": "chat_message",

                "message": {
                    "id": message["id"],
                    "team": message["team"],
                    "user": message["user"],
                    "username": message["username"],
                    "first_name": message["first_name"],
                    "last_name": message["last_name"],
                    "avatar": message["avatar"],
                    "content": message["content"],
                    "created_at": message["created_at"],
                },
            },
        )

    async def chat_message(
        self,
        event,
    ):

        await self.send_json(
            event["message"]
        )

    # ==================================================
    # DATABASE
    # ==================================================

    @database_sync_to_async
    def user_can_access_team(
        self,
        team_id,
    ):

        if (
            self.user.is_staff
            or self.user.is_superuser
        ):

            return Team.objects.filter(
                id=team_id
            ).exists()

        return TeamMember.objects.filter(
            team_id=team_id,
            user=self.user,
            is_active=True,
        ).exists()

    @database_sync_to_async
    def create_message(
        self,
        team_id,
        user,
        content,
    ):

        message = Message.objects.create(
            team_id=team_id,
            user=user,
            content=content,
        )

        return {
            "id": message.id,
            "team": message.team_id,
            "user": message.user_id,
            "username": message.user.username,
            "first_name": message.user.first_name,
            "last_name": message.user.last_name,
            "avatar": message.user.avatar,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
        }