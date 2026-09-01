from rest_framework import viewsets

from apps.notifications.models import Notification
from apps.notifications.services import NotificationService

from .models import Project
from .permissions import ProjectPermission
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):

    serializer_class = ProjectSerializer

    permission_classes = [
        ProjectPermission
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
                Project.objects
                .select_related(
                    "team",
                    "created_by",
                )
                .all()
                .order_by("-created_at")
            )

        # ==========================================
        # UTILISATEUR NORMAL
        # ==========================================

        return (
            Project.objects
            .select_related(
                "team",
                "created_by",
            )
            .filter(
                team__members__user=user,
                team__members__is_active=True,
            )
            .distinct()
            .order_by("-created_at")
        )

    # ==========================================
    # CREATE
    # ==========================================

    def perform_create(self, serializer):

        project = serializer.save(
            created_by=self.request.user
        )

        # ==========================================
        # NOTIFICATION : NOUVEAU PROJET
        # ==========================================

        NotificationService.create_for_team_members(

            team=project.team,

            notification_type=(
                Notification.NotificationType.PROJECT
            ),

            title="Nouveau projet",

            message=(
                f"Le projet « {project.name} » "
                f"a été créé dans votre équipe."
            ),

            link="/projects",

            exclude_user=self.request.user,
        )