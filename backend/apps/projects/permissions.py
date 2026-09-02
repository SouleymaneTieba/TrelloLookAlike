from rest_framework import permissions


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

        # ==========================================
        # MODIFICATION / SUPPRESSION
        # ==========================================
        #
        # Pour l'instant, seul l'admin peut
        # modifier ou supprimer un projet.
        #

        return False
