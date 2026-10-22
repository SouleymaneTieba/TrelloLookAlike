from django.db import models
from django.utils import timezone

from rest_framework import permissions, viewsets

from apps.notifications.models import Notification
from apps.notifications.services import NotificationService
from apps.teams.models import TeamMember

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

        if getattr(self, "action", None) == "list":
            self.sync_automatic_reports()

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

    def sync_automatic_reports(self):
        memberships = list(
            TeamMember.objects.filter(is_active=True)
            .values_list("user_id", "team_id")
        )
        active_memberships = set(memberships)
        assigned_task_pairs = set(
            Task.objects.exclude(status=Task.Status.DONE)
            .filter(assigned_to__isnull=False)
            .values_list("assigned_to_id", "project__team_id")
            .distinct()
        )

        automatic_reports = {
            (report.user_id, report.team_id): report
            for report in TaskAvailabilityReport.objects.filter(
                is_automatic=True
            )
        }
        active_manual_pairs = set(
            TaskAvailabilityReport.objects.filter(
                is_automatic=False,
                status=TaskAvailabilityReport.Status.ACTIVE,
            ).values_list("user_id", "team_id")
        )

        for user_id, team_id in memberships:
            pair = (user_id, team_id)
            has_open_task = pair in assigned_task_pairs
            report = automatic_reports.get(pair)

            if report is None:
                if has_open_task:
                    continue

                # An existing manual report already signals this member.
                if pair in active_manual_pairs:
                    continue

                report, _created = TaskAvailabilityReport.objects.get_or_create(
                    user_id=user_id,
                    team_id=team_id,
                    is_automatic=True,
                    defaults={
                        "message": "Aucune tâche en cours : disponibilité signalée automatiquement.",
                        "status": TaskAvailabilityReport.Status.ACTIVE,
                    },
                )
                automatic_reports[pair] = report

            expected_status = (
                TaskAvailabilityReport.Status.RESOLVED
                if has_open_task
                else TaskAvailabilityReport.Status.ACTIVE
            )
            if report.status != expected_status:
                report.status = expected_status
                report.resolved_at = timezone.now() if has_open_task else None
                report.save(update_fields=["status", "resolved_at"])

        # Close automatic reports for memberships that are no longer active.
        for pair, report in automatic_reports.items():
            if pair not in active_memberships and report.status == TaskAvailabilityReport.Status.ACTIVE:
                report.status = TaskAvailabilityReport.Status.RESOLVED
                report.resolved_at = timezone.now()
                report.save(update_fields=["status", "resolved_at"])

    # ==================================================
    # CREATE
    # ==================================================

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )
