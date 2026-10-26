from django.conf import settings
from django.db import models

from apps.projects.models import Project
from apps.teams.models import Team


class Message(models.Model):

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="chat_messages",
        null=True,
        blank=True,
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="chat_messages",
        null=True,
        blank=True,
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
            f"{self.project.name if self.project_id else self.team.name if self.team_id else 'Chat'}"
        )


class MessageReaction(models.Model):

    EMOJI_CHOICES = [
        ("👍", "Pouce levé"),
        ("❤️", "Cœur"),
        ("😂", "Rire"),
        ("😮", "Surpris"),
        ("👏", "Applaudissements"),
        ("🎉", "Célébration"),
    ]

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="reactions",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_message_reactions",
    )

    emoji = models.CharField(
        max_length=8,
        choices=EMOJI_CHOICES,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user", "emoji"],
                name="unique_user_emoji_per_chat_message",
            ),
        ]
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.emoji} - {self.message_id}"
