from rest_framework import permissions

from apps.projects.permissions import user_is_project_manager


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
        # VÉRIFIER L'APPARTENANCE AU PROJET
        # ==================================================

        is_project_manager = user_is_project_manager(obj.project, user)
        is_project_member = obj.project.members.filter(id=user.id).exists()

        if not (is_project_manager or is_project_member):
            return False

        if getattr(view, "action", None) == "comments":
            return request.method in permissions.SAFE_METHODS or request.method == "POST"

        if request.method in permissions.SAFE_METHODS:
            return True

        if (
            (is_project_manager or is_project_member)
            and request.method in ["PUT", "PATCH"]
            and "status" in request.data
            and set(request.data.keys()) <= {"status"}
        ):
            return True

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


class FeaturePermission(permissions.BasePermission):

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff or user.is_superuser:
            return True

        is_member = obj.project.members.filter(id=user.id).exists()
        is_manager = user_is_project_manager(obj.project, user)

        if request.method in permissions.SAFE_METHODS:
            return is_member or is_manager

        return is_manager


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
            return not obj.is_automatic

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
