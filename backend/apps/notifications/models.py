from django.conf import settings
from django.db import models


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        TASK_ASSIGNED = (
            "TASK_ASSIGNED",
            "Tâche assignée",
        )

        TASK_CREATED = (
            "TASK_CREATED",
            "Tâche créée",
        )

        TASK_UPDATED = (
            "TASK_UPDATED",
            "Tâche modifiée",
        )

        TASK_COMPLETED = (
            "TASK_COMPLETED",
            "Tâche terminée",
        )

        AVAILABILITY = (
            "AVAILABILITY",
            "Disponibilité",
        )

        TEAM = (
            "TEAM",
            "Équipe",
        )

        PROJECT = (
            "PROJECT",
            "Projet",
        )

        SYSTEM = (
            "SYSTEM",
            "Système",
        )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    link = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    is_read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.title}"