from rest_framework import permissions, viewsets

from .models import Message
from .serializers import MessageSerializer


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
                    "team",
                )
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
                "team",
            )
            .filter(
                team__members__user=user,
                team__members__is_active=True,
            )
            .distinct()
            .order_by(
                "created_at"
            )
        )

    def perform_create(self, serializer):

        team = serializer.validated_data["team"]

        user = self.request.user

        # ==========================================
        # VÉRIFIER L'APPARTENANCE
        # ==========================================

        is_member = (
            team.members
            .filter(
                user=user,
                is_active=True,
            )
            .exists()
        )

        if not is_member:

            from rest_framework.exceptions import (
                PermissionDenied
            )

            raise PermissionDenied(
                "Vous n'appartenez pas à cette équipe."
            )

        # ==========================================
        # CRÉER LE MESSAGE
        # ==========================================

        serializer.save(
            user=user
        )