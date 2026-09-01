from django.utils import timezone

from rest_framework import (
    decorators,
    permissions,
    response,
    status,
    viewsets,
)

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    viewsets.ReadOnlyModelViewSet
):

    serializer_class = NotificationSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    # ==================================================
    # LISTE DES NOTIFICATIONS
    # ==================================================

    def get_queryset(self):

        return (
            Notification.objects
            .filter(
                user=self.request.user
            )
            .order_by(
                "-created_at"
            )
        )

    # ==================================================
    # MARQUER UNE NOTIFICATION COMME LUE
    # ==================================================

    @decorators.action(
        detail=True,
        methods=["post"],
        url_path="read",
    )
    def mark_as_read(
        self,
        request,
        pk=None,
    ):

        notification = self.get_object()

        if not notification.is_read:

            notification.is_read = True

            notification.save(
                update_fields=[
                    "is_read"
                ]
            )

        return response.Response(
            NotificationSerializer(
                notification
            ).data
        )

    # ==================================================
    # MARQUER TOUTES LES NOTIFICATIONS COMME LUES
    # ==================================================

    @decorators.action(
        detail=False,
        methods=["post"],
        url_path="read-all",
    )
    def mark_all_as_read(
        self,
        request,
    ):

        updated_count = (
            Notification.objects
            .filter(
                user=request.user,
                is_read=False,
            )
            .update(
                is_read=True
            )
        )

        return response.Response(
            {
                "message":
                    "Toutes les notifications "
                    "ont été marquées comme lues.",

                "updated_count":
                    updated_count,
            }
        )

    # ==================================================
    # NOMBRE DE NOTIFICATIONS NON LUES
    # ==================================================

    @decorators.action(
        detail=False,
        methods=["get"],
        url_path="unread-count",
    )
    def unread_count(
        self,
        request,
    ):

        count = (
            Notification.objects
            .filter(
                user=request.user,
                is_read=False,
            )
            .count()
        )

        return response.Response(
            {
                "count": count
            }
        )