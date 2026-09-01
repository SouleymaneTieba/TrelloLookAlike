from django.conf import settings
from django.db import models

from apps.teams.models import Team


class Message(models.Model):

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )

    content = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:

        ordering = [
            "created_at",
        ]

    def __str__(self):

        return (
            f"{self.user.username} - "
            f"{self.team.name}"
        )