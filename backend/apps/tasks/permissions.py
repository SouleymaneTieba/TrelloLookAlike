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

        is_creator = obj.created_by_id == user.id
        is_assignee = obj.assigned_to_id == user.id

        if not (is_creator or is_assignee):
            return False

        # ==================================================
        # LECTURE
        # ==================================================

        if request.method in permissions.SAFE_METHODS:
            return True

        # ==================================================
        # TACHE CRÉÉE PAR L'UTILISATEUR
        # ==================================================

        if is_creator:

            if request.method == "DELETE":
                return True

            if request.method in [
                "PUT",
                "PATCH",
            ]:

                status_only = (
                    set(request.data.keys())
                    <= {"status"}
                )

                return True

        # ==================================================
        # TACHE ASSIGNÉE À L'UTILISATEUR
        # ==================================================

        if is_assignee:

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

                return False

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