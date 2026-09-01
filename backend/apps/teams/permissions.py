from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):

    message = (
        "Vous devez être administrateur "
        "pour effectuer cette action."
    )

    def has_permission(self, request, view):

        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or request.user.is_superuser
            )
        )


class TeamPermission(permissions.BasePermission):

    message = (
        "Vous n'avez pas la permission "
        "d'effectuer cette action."
    )

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

        # ==========================================
        # ADMIN
        # ==========================================

        if (
            user.is_staff
            or user.is_superuser
        ):
            return True

        # ==========================================
        # VÉRIFIER L'APPARTENANCE À L'ÉQUIPE
        # ==========================================

        is_member = (
            obj.members
            .filter(
                user=user,
                is_active=True,
            )
            .exists()
        )

        if not is_member:
            return False

        # ==========================================
        # LECTURE
        # ==========================================

        if request.method in permissions.SAFE_METHODS:
            return True

        # ==========================================
        # UTILISATEUR NORMAL
        # ==========================================

        # Les membres ne peuvent pas modifier
        # ou supprimer une équipe.

        return False