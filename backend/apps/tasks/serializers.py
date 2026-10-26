from rest_framework import serializers

from apps.projects.permissions import user_is_project_manager

from .models import (
    Feature,
    Task,
    TaskAvailabilityReport,
)


class FeatureSerializer(serializers.ModelSerializer):

    project_name = serializers.CharField(source="project.name", read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        allow_null=True,
    )
    subtask_count = serializers.SerializerMethodField()
    completed_subtask_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Feature
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "created_by",
            "created_by_username",
            "subtask_count",
            "completed_subtask_count",
            "progress",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_by",
            "created_by_username",
            "project_name",
            "subtask_count",
            "completed_subtask_count",
            "progress",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project", getattr(self.instance, "project", None))
        if request and project:
            is_admin = request.user.is_staff or request.user.is_superuser
            if not is_admin and not user_is_project_manager(project, request.user):
                raise serializers.ValidationError({
                    "project": "Seul le chef de projet peut créer ou modifier une fonctionnalité."
                })
        return attrs

    def get_subtask_count(self, obj):
        return obj.subtasks.count()

    def get_completed_subtask_count(self, obj):
        return obj.subtasks.filter(status=Task.Status.DONE).count()

    def get_progress(self, obj):
        total = obj.subtasks.count()
        if not total:
            return 0
        completed = obj.subtasks.filter(status=Task.Status.DONE).count()
        return round(completed * 100 / total)


class TaskSerializer(serializers.ModelSerializer):

    assigned_username = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
    )

    feature_title = serializers.CharField(
        source="feature.title",
        read_only=True,
    )

    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    priority_label = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )

    class Meta:

        model = Task

        fields = [
            "id",
            "title",
            "description",

            "project",
            "project_name",

            "feature",
            "feature_title",

            "assigned_to",
            "assigned_username",

            "created_by",
            "created_by_username",

            "status",
            "status_label",

            "priority",
            "priority_label",

            "deadline",
            "start_date",
            "end_date",
            "completed_at",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "project",
            "created_by",
            "created_by_username",
            "assigned_username",
            "project_name",
            "feature_title",
            "status_label",
            "priority_label",
            "completed_at",
        ]

    # ==========================================
    # VALIDATION
    # ==========================================

    def validate(self, attrs):

        request = self.context.get(
            "request"
        )

        if not request:
            return attrs

        user = request.user

        # ==========================================
        # RÉCUPÉRER LES DONNÉES
        # ==========================================

        feature = attrs.get(
            "feature",
            getattr(self.instance, "feature", None),
        )

        project = feature.project if feature else None

        assigned_to = attrs.get(
            "assigned_to",
            getattr(
                self.instance,
                "assigned_to",
                None,
            ),
        )

        deadline = attrs.get(
            "deadline",
            getattr(
                self.instance,
                "deadline",
                None,
            ),
        )

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "La date de fin doit être postérieure ou égale à la date de début."
            })

        # ==========================================
        # ADMIN ?
        # ==========================================

        is_admin = (
            user.is_staff
            or user.is_superuser
        )

        # ==========================================
        # PROJET OBLIGATOIRE
        # ==========================================

        if not project:

            raise serializers.ValidationError({
                "feature": "Une fonctionnalité est obligatoire pour cette sous-tâche."
            })

        if self.instance and project.id != self.instance.project_id:
            raise serializers.ValidationError({
                "feature": "Une sous-tâche doit rester dans le même projet."
            })

        # ==========================================
        # UTILISATEUR MEMBRE DU PROJET ?
        # ==========================================

        is_project_manager = user_is_project_manager(project, user)
        is_project_member = project.members.filter(id=user.id).exists()

        if (
            not is_admin
            and not (is_project_member or is_project_manager)
        ):

            raise serializers.ValidationError({
                "feature":
                    "Vous ne faites pas partie de ce projet."
            })

        if not self.instance and not (is_admin or is_project_manager):
            raise serializers.ValidationError({
                "feature": "Seul le chef de projet peut créer des sous-tâches."
            })

        attrs["project"] = project

        # ==========================================
        # CHEF DE PROJET ?
        # ==========================================

        # ==========================================
        # ASSIGNATION
        # ==========================================

        if assigned_to:

            # --------------------------------------
            # La personne assignée doit appartenir
            # au projet
            # --------------------------------------

            assigned_user_is_member = (
                project.members.filter(id=assigned_to.id).exists()
                or user_is_project_manager(project, assigned_to)
            )

            if not assigned_user_is_member:

                raise serializers.ValidationError({
                    "assigned_to":
                        "Cet utilisateur ne fait pas "
                        "partie du projet."
                })

            # --------------------------------------
            # Un membre normal ne peut assigner
            # qu'à lui-même
            # --------------------------------------

        if (
            not is_admin
            and not is_project_manager
        ):

            # Si aucun utilisateur n'est spécifié,
            # la tâche est automatiquement assignée
            # à l'utilisateur connecté.

            if not assigned_to:

                attrs["assigned_to"] = user

                assigned_to = user

            # Un membre normal ne peut assigner
            # une tâche qu'à lui-même.

            elif assigned_to.id != user.id:

                raise serializers.ValidationError({
                    "assigned_to":
                        "Vous ne pouvez assigner une tâche "
                        "qu'à vous-même."
                })

        # ------------------------------------------
        # ADMIN / CHEF DE PROJET
        # ------------------------------------------

        if assigned_to:

            assigned_user_is_member = (
                project.members.filter(id=assigned_to.id).exists()
                or user_is_project_manager(project, assigned_to)
            )

            if not assigned_user_is_member:

                raise serializers.ValidationError({
                    "assigned_to":
                        "Cet utilisateur ne fait pas "
                        "partie du projet."
                })
        # ==========================================
        # DEADLINE
        # ==========================================

        if (
            deadline
            and project.end_date
            and deadline.date() > project.end_date
        ):

            raise serializers.ValidationError({
                "deadline":
                    "La deadline de la tâche ne peut pas "
                    "dépasser la date de fin du projet."
            })

        return attrs


class TaskAvailabilityReportSerializer(
    serializers.ModelSerializer
):

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    team_name = serializers.CharField(
        source="team.name",
        read_only=True,
    )

    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:

        model = TaskAvailabilityReport

        fields = [
            "id",

            "user",
            "username",
            "first_name",
            "last_name",

            "team",
            "team_name",

            "message",

            "status",
            "status_label",
            "is_automatic",

            "created_at",
            "resolved_at",
        ]

        read_only_fields = [
            "user",
            "username",
            "first_name",
            "last_name",

            "status",
            "status_label",
            "is_automatic",

            "created_at",
            "resolved_at",
        ]
