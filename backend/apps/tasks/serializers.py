from rest_framework import serializers

from .models import Task, TaskAvailabilityReport


class TaskSerializer(serializers.ModelSerializer):
    assigned_username = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "project",
            "assigned_to",
            "assigned_username",
            "created_by",
            "status",
            "priority",
            "deadline",
            "completed_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_by",
            "completed_at",
        ]


class TaskAvailabilityReportSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = TaskAvailabilityReport
        fields = [
            "id",
            "user",
            "team",
            "message",
            "status",
            "created_at",
            "resolved_at",
        ]

        read_only_fields = [
            "user",
            "status",
            "created_at",
            "resolved_at",
        ]