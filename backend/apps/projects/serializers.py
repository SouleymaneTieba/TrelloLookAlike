from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.users.presence import is_user_online

from .models import Project, ProjectMemberRole


User = get_user_model()


class ProjectSerializer(serializers.ModelSerializer):

    members = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(is_active=True),
        required=False,
    )
    member_details = serializers.SerializerMethodField()
    project_manager_ids = serializers.SerializerMethodField()
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
            "members",
            "member_details",
            "project_manager_ids",
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
            "member_details",
            "project_manager_ids",
            "status_label",
            "task_count",
            "completed_task_count",
        ]

    def get_member_details(self, obj):
        role_by_user_id = {
            membership.user_id: membership.role
            for membership in obj.member_roles.select_related("role")
        }
        return [
            {
                "id": member.id,
                "username": member.username,
                "first_name": member.first_name,
                "last_name": member.last_name,
                "email": member.email,
                "job_title": member.job_title,
                "is_active": member.is_active,
                "is_online": is_user_online(member.id),
                "role_id": role_by_user_id[member.id].id if role_by_user_id.get(member.id) else None,
                "role": role_by_user_id[member.id].slug if role_by_user_id.get(member.id) else None,
                "role_label": role_by_user_id[member.id].label if role_by_user_id.get(member.id) else "Sans rôle",
            }
            for member in obj.members.filter(is_active=True).order_by(
                "first_name", "last_name", "username"
            )
        ]

    def get_project_manager_ids(self, obj):
        return list(
            ProjectMemberRole.objects.filter(
                project=obj,
                role__slug="PROJECT_MANAGER",
            ).values_list("user_id", flat=True)
        )

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_completed_task_count(self, obj):
        return obj.tasks.filter(status="DONE").count()
