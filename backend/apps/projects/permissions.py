from rest_framework import permissions


def user_is_project_manager(project, user):
    return project.member_roles.filter(
        user_id=user.id,
        role__slug="PROJECT_MANAGER",
    ).exists()


class ProjectPermission(permissions.BasePermission):

    def has_permission(self, request, view):

        is_authenticated = bool(
            request.user
            and request.user.is_authenticated
        )

        if not is_authenticated:
            return False

        if request.method == "POST":
            return bool(
                request.user.is_staff
                or request.user.is_superuser
            )

        return True

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):

        user = request.user

        # ==========================================
        # ADMIN
        # ==========================================

        if (
            user.is_staff
            or user.is_superuser
        ):
            return True

        # ==========================================
        # LECTURE
        # ==========================================

        if request.method in permissions.SAFE_METHODS:
            return True

        if getattr(view, "action", None) == "members":
            return user_is_project_manager(obj, user)

        # ==========================================
        # MODIFICATION / SUPPRESSION
        # ==========================================
        #
        # Pour l'instant, seul l'admin peut
        # modifier ou supprimer un projet.
        #

        return False
