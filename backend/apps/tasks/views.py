from django.db import models
from django.utils import timezone

from rest_framework import permissions, viewsets

from apps.notifications.models import Notification
from apps.notifications.services import NotificationService

from .models import (
    Task,
    TaskAvailabilityReport,
)

from .permissions import (
    AvailabilityPermission,
    TaskPermission,
)

from .serializers import (
    TaskAvailabilityReportSerializer,
    TaskSerializer,
)


class TaskViewSet(viewsets.ModelViewSet):

    serializer_class = TaskSerializer

    permission_classes = [
        TaskPermission
    ]

    # ==================================================
    # QUERYSET
    # ==================================================

    def get_queryset(self):

        user = self.request.user

        base_queryset = (
            Task.objects
            .select_related(
                "project",
                "project__team",
                "assigned_to",
                "created_by",
            )
        )

        # ==================================================
        # ADMIN
        # ==================================================

        if (
            user.is_staff
            or user.is_superuser
        ):

            return (
                base_queryset
                .all()
                .order_by("-created_at")
            )

        # ==================================================
        # CHEF DE PROJET
        # ==================================================

        is_project_manager = (
            user.team_memberships
            .filter(
                role__slug="PROJECT_MANAGER",
                is_active=True,
            )
            .exists()
        )

        if is_project_manager:

            return (
                base_queryset
                .filter(
                    project__team__members__user=user,
                    project__team__members__role__slug="PROJECT_MANAGER",
                    project__team__members__is_active=True,
                )
                .distinct()
                .order_by("-created_at")
            )

        # ==================================================
        # MEMBRE NORMAL
        # ==================================================

        return (
            base_queryset
            .filter(
                project__team__members__user=user,
                project__team__members__is_active=True,
            )
            .filter(
                models.Q(assigned_to=user)
                | models.Q(created_by=user)
            )
            .distinct()
            .order_by("-created_at")
        )

    # ==================================================
    # CREATE
    # ==================================================

    def perform_create(self, serializer):

        task = serializer.save(
            created_by=self.request.user
        )

        # ==================================================
        # NOTIFICATION : TÂCHE ASSIGNÉE
        # ==================================================

        if (
            task.assigned_to
            and task.assigned_to_id
            != self.request.user.id
        ):

            NotificationService.create(

                user=task.assigned_to,

                notification_type=(
                    Notification.NotificationType
                    .TASK_ASSIGNED
                ),

                title="Nouvelle tâche assignée",

                message=(
                    f"La tâche « {task.title} » "
                    f"vous a été assignée."
                ),

                link="/tasks",
            )

    # ==================================================
    # UPDATE
    # ==================================================

    def perform_update(self, serializer):

        task = serializer.save()

        # ==================================================
        # TÂCHE TERMINÉE
        # ==================================================

        if (
            task.status == Task.Status.DONE
            and not task.completed_at
        ):

            task.completed_at = timezone.now()

            task.save(
                update_fields=[
                    "completed_at"
                ]
            )

            # ==================================================
            # NOTIFICATION : TÂCHE TERMINÉE
            # ==================================================

            recipients = []

            if task.created_by:
                recipients.append(
                    task.created_by
                )

            if task.assigned_to:
                recipients.append(
                    task.assigned_to
                )

            NotificationService.create_for_users(

                users=recipients,

                notification_type=(
                    Notification.NotificationType
                    .TASK_COMPLETED
                ),

                title="Tâche terminée",

                message=(
                    f"La tâche « {task.title} » "
                    f"a été terminée."
                ),

                link="/tasks",

                exclude_user=self.request.user,
            )

        # ==================================================
        # ANNULER LA DATE DE COMPLÉTION
        # ==================================================

        elif (
            task.status != Task.Status.DONE
            and task.completed_at
        ):

            task.completed_at = None

            task.save(
                update_fields=[
                    "completed_at"
                ]
            )


class TaskAvailabilityReportViewSet(
    viewsets.ModelViewSet
):

    serializer_class = (
        TaskAvailabilityReportSerializer
    )

    permission_classes = [
        AvailabilityPermission
    ]

    # ==================================================
    # QUERYSET
    # ==================================================

    def get_queryset(self):

        user = self.request.user

        # ==================================================
        # ADMIN
        # ==================================================

        if (
            user.is_staff
            or user.is_superuser
        ):

            return (
                TaskAvailabilityReport.objects
                .select_related(
                    "user",
                    "team",
                )
                .all()
                .order_by("-created_at")
            )

        # ==================================================
        # UTILISATEUR
        # ==================================================

        return (
            TaskAvailabilityReport.objects
            .select_related(
                "user",
                "team",
            )
            .filter(
                user=user,
            )
            .order_by("-created_at")
        )

    # ==================================================
    # CREATE
    # ==================================================

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )