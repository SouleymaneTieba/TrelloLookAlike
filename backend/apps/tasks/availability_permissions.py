from rest_framework import permissions


class AvailabilityReportPermission(
    permissions.BasePermission
):

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

        # Admin
        if user.is_staff or user.is_superuser:
            return True

        # Le propriétaire peut consulter/modifier
        if obj.user_id == user.id:
            return True

        # Chef de projet de l'équipe
        return obj.team.members.filter(
            user=user,
            role__slug="PROJECT_MANAGER",
            is_active=True,
        ).exists()