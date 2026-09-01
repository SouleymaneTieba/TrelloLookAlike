from rest_framework import permissions


class TaskPermission(permissions.BasePermission):

    def has_permission(self, request, view):

        return bool(
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):

        user = request.user

        # ==================================================
        # ADMIN
        # ==================================================

        if (
            user.is_staff
            or user.is_superuser
        ):
            return True

        # ==================================================
        # CHEF DE PROJET
        # ==================================================

        is_project_manager = (
            obj.project.team.members
            .filter(
                user=user,
                role="PROJECT_MANAGER",
                is_active=True,
            )
            .exists()
        )

        if is_project_manager:

            # Le chef de projet peut gérer
            # les tâches de son équipe.

            return True

        # ==================================================
        # VÉRIFIER L'APPARTENANCE À L'ÉQUIPE
        # ==================================================

        is_team_member = (
            obj.project.team.members
            .filter(
                user=user,
                is_active=True,
            )
            .exists()
        )

        if not is_team_member:
            return False

        # ==================================================
        # MEMBRE NORMAL
        # ==================================================

        # Un membre normal ne peut accéder
        # qu'aux tâches qui lui sont assignées.

        if obj.assigned_to_id != user.id:
            return False

        # ==================================================
        # LECTURE
        # ==================================================

        if request.method in permissions.SAFE_METHODS:
            return True

        # ==================================================
        # MODIFICATION DU STATUT
        # ==================================================

        if request.method in [
            "PUT",
            "PATCH",
        ]:

            status_only = (
                set(request.data.keys())
                <= {"status"}
            )

            if status_only:
                return True

            # Un membre normal ne peut pas
            # modifier le reste de la tâche.

            return False

        # ==================================================
        # SUPPRESSION
        # ==================================================

        if request.method == "DELETE":
            return False

        return False


class AvailabilityPermission(
    permissions.BasePermission
):

    def has_permission(
        self,
        request,
        view,
    ):

        return bool(
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):

        user = request.user

        # ==========================
        # ADMIN
        # ==========================

        if (
            user.is_staff
            or user.is_superuser
        ):
            return True

        # ==========================
        # PROPRIÉTAIRE
        # ==========================

        if obj.user_id != user.id:
            return False

        # ==========================
        # LECTURE
        # ==========================

        if request.method in permissions.SAFE_METHODS:
            return True

        # ==========================
        # MEMBRE
        # ==========================

        if request.method in [
            "PUT",
            "PATCH",
        ]:
            return True

        if request.method == "DELETE":
            return False

        return False