from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Message
from .serializers import MessageSerializer
from .services import toggle_message_reaction


class MessageViewSet(viewsets.ModelViewSet):

    serializer_class = MessageSerializer

    def get_permissions(self):

        return [
            permissions.IsAuthenticated()
        ]

    def get_queryset(self):

        user = self.request.user

        # ==========================================
        # ADMIN
        # ==========================================

        if (
            user.is_staff
            or user.is_superuser
        ):

            return (
                Message.objects
                .select_related(
                    "user",
                    "project",
                )
                .prefetch_related("reactions")
                .all()
                .order_by(
                    "created_at"
                )
            )

        # ==========================================
        # UTILISATEUR NORMAL
        # ==========================================

        return (
            Message.objects
            .select_related(
                "user",
                "project",
            )
            .prefetch_related("reactions")
            .filter(
                project__members=user,
            )
            .distinct()
            .order_by(
                "created_at"
            )
        )

    def perform_create(self, serializer):

        project = serializer.validated_data["project"]

        user = self.request.user

        # ==========================================
        # VÉRIFIER L'APPARTENANCE
        # ==========================================

        is_admin = user.is_staff or user.is_superuser
        is_member = project.members.filter(id=user.id).exists()

        if not (is_admin or is_member):

            from rest_framework.exceptions import (
                PermissionDenied
            )

            raise PermissionDenied(
                "Vous ne faites pas partie de ce projet."
            )

        # ==========================================
        # CRÉER LE MESSAGE
        # ==========================================

        serializer.save(
            user=user
        )

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    @action(detail=True, methods=["post"])
    def react(self, request, pk=None):
        message = self.get_object()
        emoji = request.data.get("emoji", "")

        try:
            reactions = toggle_message_reaction(
                message=message,
                user=request.user,
                emoji=emoji,
            )
        except ValueError as error:
            raise ValidationError({"emoji": str(error)}) from error

        event = {
            "type": "chat_reaction",
            "message_id": message.id,
            "reacted_user_id": request.user.id,
            "reactions": reactions,
        }
        async_to_sync(get_channel_layer().group_send)(
            f"chat_project_{message.project_id}",
            event,
        )

        return Response(
            {
                "message_id": message.id,
                "reactions": reactions,
            },
            status=status.HTTP_200_OK,
        )
