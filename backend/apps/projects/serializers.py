from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):

    team_name = serializers.CharField(
        source="team.name",
        read_only=True,
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    task_count = serializers.SerializerMethodField()

    completed_task_count = serializers.SerializerMethodField()

    class Meta:

        model = Project

        fields = [
            "id",

            "name",
            "description",

            "team",
            "team_name",

            "created_by",
            "created_by_username",

            "status",
            "status_label",

            "start_date",
            "end_date",

            "task_count",
            "completed_task_count",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_by",
            "created_by_username",
            "team_name",
            "status_label",
            "task_count",
        ]

    def get_task_count(self, obj):

        return obj.tasks.count()

    def get_completed_task_count(self, obj):

        return obj.tasks.filter(
            status="DONE"
        ).count()