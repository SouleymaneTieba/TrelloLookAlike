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