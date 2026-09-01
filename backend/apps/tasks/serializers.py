from rest_framework import serializers

from .models import (
    Task,
    TaskAvailabilityReport,
)


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

    team_name = serializers.CharField(
        source="project.team.name",
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

            "team_name",

            "assigned_to",
            "assigned_username",

            "created_by",
            "created_by_username",

            "status",
            "status_label",

            "priority",
            "priority_label",

            "deadline",
            "completed_at",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_by",
            "created_by_username",
            "assigned_username",
            "project_name",
            "team_name",
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

        project = attrs.get(
            "project",
            getattr(
                self.instance,
                "project",
                None,
            ),
        )

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
                "project":
                    "Un projet est obligatoire."
            })

        # ==========================================
        # UTILISATEUR MEMBRE DE L'ÉQUIPE ?
        # ==========================================

        is_team_member = (
            project.team.members
            .filter(
                user=user,
                is_active=True,
            )
            .exists()
        )

        if (
            not is_admin
            and not is_team_member
        ):

            raise serializers.ValidationError({
                "project":
                    "Vous n'appartenez pas à l'équipe "
                    "de ce projet."
            })

        # ==========================================
        # CHEF DE PROJET ?
        # ==========================================

        is_project_manager = (
            project.team.members
            .filter(
                user=user,
                role="PROJECT_MANAGER",
                is_active=True,
            )
            .exists()
        )

        # ==========================================
        # ASSIGNATION
        # ==========================================

        if assigned_to:

            # --------------------------------------
            # La personne assignée doit appartenir
            # à l'équipe du projet
            # --------------------------------------

            assigned_user_is_member = (
                project.team.members
                .filter(
                    user=assigned_to,
                    is_active=True,
                )
                .exists()
            )

            if not assigned_user_is_member:

                raise serializers.ValidationError({
                    "assigned_to":
                        "Cet utilisateur ne fait pas "
                        "partie de l'équipe du projet."
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
                project.team.members
                .filter(
                    user=assigned_to,
                    is_active=True,
                )
                .exists()
            )

            if not assigned_user_is_member:

                raise serializers.ValidationError({
                    "assigned_to":
                        "Cet utilisateur ne fait pas "
                        "partie de l'équipe du projet."
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

            "created_at",
            "resolved_at",
        ]