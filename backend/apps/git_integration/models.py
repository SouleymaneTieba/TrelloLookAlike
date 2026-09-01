from django.db import models

from apps.projects.models import Project


class GitRepository(models.Model):

    class Provider(models.TextChoices):
        GITHUB = "GITHUB", "GitHub"
        GITLAB = "GITLAB", "GitLab"

    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="git_repository",
    )

    provider = models.CharField(
        max_length=20,
        choices=Provider.choices,
        default=Provider.GITHUB,
    )

    owner = models.CharField(
        max_length=150,
    )

    name = models.CharField(
        max_length=150,
    )

    url = models.URLField(
        max_length=500,
    )

    webhook_secret = models.CharField(
        max_length=255,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"{self.owner}/{self.name}"
            f" - {self.project.name}"
        )