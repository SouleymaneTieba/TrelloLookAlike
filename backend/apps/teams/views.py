from rest_framework import viewsets

from apps.notifications.models import Notification
from apps.notifications.services import NotificationService

from .models import Team, TeamMember

from .permissions import (
    IsAdminUser,
    TeamPermission,
)

from .serializers import (
    TeamMemberSerializer,
    TeamSerializer,
)


class TeamViewSet(viewsets.ModelViewSet):

    serializer_class = TeamSerializer

    def get_permissions(self):

        # ==========================================
        # ADMIN
        # ==========================================

        if (
            self.request.user.is_staff
            or self.request.user.is_superuser
        ):

            return [
                IsAdminUser()
            ]

        # ==========================================
        # UTILISATEUR NORMAL
        # ==========================================

        return [
            TeamPermission()
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
                Team.objects
                .prefetch_related(
                    "members__user",
                )
                .all()
                .order_by("-created_at")
            )

        # ==========================================
        # UTILISATEUR NORMAL
        # ==========================================

        return (
            Team.objects
            .prefetch_related(
                "members__user",
            )
            .filter(
                members__user=user,
                members__is_active=True,
            )
            .distinct()
            .order_by("-created_at")
        )

    def perform_create(self, serializer):

        serializer.save(
            created_by=self.request.user
        )


class TeamMemberViewSet(viewsets.ModelViewSet):

    serializer_class = TeamMemberSerializer

    # ==========================================
    # PERMISSIONS
    # ==========================================

    def get_permissions(self):

        return [
            IsAdminUser()
        ]

    # ==========================================
    # QUERYSET
    # ==========================================

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
                TeamMember.objects
                .select_related(
                    "user",
                    "team",
                )
                .all()
                .order_by(
                    "team__name",
                    "user__username",
                )
            )

        # ==========================================
        # UTILISATEUR NORMAL
        # ==========================================

        return (
            TeamMember.objects
            .select_related(
                "user",
                "team",
            )
            .filter(
                user=user,
                is_active=True,
            )
            .order_by(
                "team__name",
            )
        )

    # ==========================================
    # CREATE
    # ==========================================

    def perform_create(self, serializer):

        member = serializer.save()

        # ==========================================
        # NOTIFICATION : AJOUT À UNE ÉQUIPE
        # ==========================================

        NotificationService.create(

            user=member.user,

            notification_type=(
                Notification.NotificationType.TEAM
            ),

            title="Vous avez rejoint une équipe",

            message=(
                f"Vous avez été ajouté à l'équipe "
                f"« {member.team.name} »."
            ),

            link="/teams",
        )

    # ==========================================
    # UPDATE
    # ==========================================

    def perform_update(self, serializer):

        member = self.get_object()

        old_role = member.role
        old_is_active = member.is_active

        member = serializer.save()

        # ==========================================
        # CHANGEMENT DE RÔLE
        # ==========================================

        if member.role != old_role:

            new_role = member.get_role_display()

            NotificationService.create(

                user=member.user,

                notification_type=(
                    Notification.NotificationType.TEAM
                ),

                title="Votre rôle a changé",

                message=(
                    f"Votre rôle dans l'équipe "
                    f"« {member.team.name} » "
                    f"est maintenant : {new_role}."
                ),

                link="/teams",
            )

        # ==========================================
        # DÉSACTIVATION
        # ==========================================

        if (
            old_is_active
            and not member.is_active
        ):

            NotificationService.create(

                user=member.user,

                notification_type=(
                    Notification.NotificationType.TEAM
                ),

                title="Accès à l'équipe désactivé",

                message=(
                    f"Votre accès à l'équipe "
                    f"« {member.team.name} » "
                    f"a été désactivé."
                ),

                link="/teams",
            )

        # ==========================================
        # RÉACTIVATION
        # ==========================================

        elif (
            not old_is_active
            and member.is_active
        ):

            NotificationService.create(

                user=member.user,

                notification_type=(
                    Notification.NotificationType.TEAM
                ),

                title="Accès à l'équipe réactivé",

                message=(
                    f"Votre accès à l'équipe "
                    f"« {member.team.name} » "
                    f"a été réactivé."
                ),

                link="/teams",
            )