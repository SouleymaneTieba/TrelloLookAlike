from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.notifications.models import Notification
from apps.notifications.services import NotificationService
from apps.teams.models import Role

from .models import Project, ProjectMemberRole
from .permissions import ProjectPermission, user_is_project_manager
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
                    "created_by",
                )
                .prefetch_related("members")
                .all()
                .order_by("-created_at")
            )

        # ==========================================
        # UTILISATEUR NORMAL
        # ==========================================

        return (
            Project.objects
            .select_related(
                "created_by",
            )
            .prefetch_related("members")
            .filter(members=user)
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

        for member in project.members.exclude(id=self.request.user.id):
            NotificationService.create(
                user=member,
                notification_type=Notification.NotificationType.PROJECT,
                title="Nouveau projet",
                message=f"Vous avez été ajouté au projet « {project.name} ».",
                link="/projects",
            )

    @action(detail=True, methods=["get", "put", "patch"], url_path="members")
    def members(self, request, pk=None):
        project = self.get_object()
        is_admin = request.user.is_staff or request.user.is_superuser

        if not is_admin and not user_is_project_manager(project, request.user):
            raise PermissionDenied(
                "Seul le chef de projet peut gérer les membres du projet."
            )

        User = get_user_model()

        if request.method == "GET":
            available_members = User.objects.filter(is_active=True).exclude(
                id__in=project.members.values("id")
            ).order_by("first_name", "last_name", "username")
            return Response({
                "members": ProjectSerializer(project).data["member_details"],
                "roles": [
                    {"id": role.id, "slug": role.slug, "label": role.label}
                    for role in Role.objects.all().order_by("label")
                ],
                "available_members": [
                    {
                        "id": member.id,
                        "username": member.username,
                        "first_name": member.first_name,
                        "last_name": member.last_name,
                        "email": member.email,
                    }
                    for member in available_members
                ],
            })

        if request.method == "PATCH":
            user_id = request.data.get("user")
            role_id = request.data.get("role")
            if not user_id or not project.members.filter(id=user_id).exists():
                raise ValidationError({"user": "Ce membre ne fait pas partie du projet."})

            role = None
            if role_id:
                try:
                    role = Role.objects.get(id=role_id)
                except Role.DoesNotExist as error:
                    raise ValidationError({"role": "Ce rôle n’existe pas."}) from error

            ProjectMemberRole.objects.update_or_create(
                project=project,
                user_id=user_id,
                defaults={"role": role},
            )
            return Response(ProjectSerializer(project).data, status=status.HTTP_200_OK)

        raw_member_ids = request.data.get("members")
        if not isinstance(raw_member_ids, list):
            raise ValidationError({"members": "Fournissez une liste de membres."})

        members = list(User.objects.filter(
            id__in=raw_member_ids,
            is_active=True,
        ))
        if len({member.id for member in members}) != len(set(raw_member_ids)):
            raise ValidationError({"members": "Un ou plusieurs membres sont invalides."})

        previous_member_ids = set(project.members.values_list("id", flat=True))
        member_ids = {member.id for member in members}
        if not is_admin:
            member_ids.add(request.user.id)
        project.members.set(member_ids)
        ProjectMemberRole.objects.filter(
            project=project,
            user_id__in=previous_member_ids - member_ids,
        ).delete()
        for member_id in member_ids:
            ProjectMemberRole.objects.get_or_create(
                project=project,
                user_id=member_id,
            )

        added_members = User.objects.filter(id__in=member_ids - previous_member_ids)
        for member in added_members:
            NotificationService.create(
                user=member,
                notification_type=Notification.NotificationType.PROJECT,
                title="Ajouté à un projet",
                message=f"Vous avez été ajouté au projet « {project.name} ».",
                link="/projects",
            )

        return Response(ProjectSerializer(project).data, status=status.HTTP_200_OK)
