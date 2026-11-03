from django.conf import settings
from django.db import models

from apps.projects.models import Project


class Feature(models.Model):

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="features",
    )

    title = models.CharField(max_length=200)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_features",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.project.name}"


class Task(models.Model):

    class Status(models.TextChoices):
        TODO = "TODO", "À faire"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        BLOCKED = "BLOCKED", "Bloquée"
        DONE = "DONE", "Terminée"

    class Priority(models.TextChoices):
        LOW = "LOW", "Faible"
        MEDIUM = "MEDIUM", "Moyenne"
        HIGH = "HIGH", "Haute"
        URGENT = "URGENT", "Urgente"

    title = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    feature = models.ForeignKey(
        Feature,
        on_delete=models.CASCADE,
        related_name="subtasks",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tasks",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    deadline = models.DateTimeField(
        null=True,
        blank=True,
    )

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TaskComment(models.Model):

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="task_comments",
    )

    content = models.TextField(max_length=5000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"Commentaire de {self.author_id} sur la tâche {self.task_id}"


class TaskAvailabilityReport(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Actif"
        RESOLVED = "RESOLVED", "Résolu"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="availability_reports",
    )

    team = models.ForeignKey(
        "teams.Team",
        on_delete=models.CASCADE,
        related_name="availability_reports",
    )

    message = models.TextField(
        blank=True,
        default="Je n'ai aucune tâche actuellement.",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_automatic = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "team"],
                condition=models.Q(is_automatic=True),
                name="unique_automatic_availability_per_member_team",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.status}"
