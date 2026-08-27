from django.utils import timezone
from rest_framework import permissions, viewsets

from .models import Task, TaskAvailabilityReport
from .serializers import (
    TaskAvailabilityReportSerializer,
    TaskSerializer,
)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            project__team__members__user=self.request.user,
            project__team__members__is_active=True,
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        task = serializer.save()

        if task.status == Task.Status.DONE and not task.completed_at:
            task.completed_at = timezone.now()
            task.save(update_fields=["completed_at"])


class TaskAvailabilityReportViewSet(
    viewsets.ModelViewSet
):
    serializer_class = TaskAvailabilityReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TaskAvailabilityReport.objects.filter(
            team__members__user=self.request.user,
            team__members__is_active=True,
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)