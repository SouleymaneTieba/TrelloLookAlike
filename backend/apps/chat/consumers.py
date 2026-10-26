from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.projects.models import Project

from .models import Message


class ChatConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):

        self.project_id = self.scope["url_route"]["kwargs"][
            "project_id"
        ]

        self.room_group_name = (
            f"chat_project_{self.project_id}"
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
        # VÉRIFIER L'APPARTENANCE AU PROJET
        # ==========================================

        is_allowed = await self.user_can_access_project(
            self.project_id
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
            project_id=self.project_id,
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
                    "project": message["project"],
                    "user": message["user"],
                    "username": message["username"],
                    "first_name": message["first_name"],
                    "last_name": message["last_name"],
                    "avatar": message["avatar"],
                    "content": message["content"],
                    "created_at": message["created_at"],
                    "reactions": message["reactions"],
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

    async def chat_reaction(self, event):
        await self.send_json(
            {
                "type": "reaction",
                "message_id": event["message_id"],
                "reacted_user_id": event["reacted_user_id"],
                "reactions": event["reactions"],
            }
        )

    # ==================================================
    # DATABASE
    # ==================================================

    @database_sync_to_async
    def user_can_access_project(
        self,
        project_id,
    ):

        if (
            self.user.is_staff
            or self.user.is_superuser
        ):

            return Project.objects.filter(
                id=project_id
            ).exists()

        return Project.objects.filter(
            id=project_id,
            members=self.user,
        ).exists()

    @database_sync_to_async
    def create_message(
        self,
        project_id,
        user,
        content,
    ):

        message = Message.objects.create(
            project_id=project_id,
            user=user,
            content=content,
        )

        return {
            "id": message.id,
            "project": message.project_id,
            "user": message.user_id,
            "username": message.user.username,
            "first_name": message.user.first_name,
            "last_name": message.user.last_name,
            "avatar": message.user.avatar,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "reactions": [],
        }
