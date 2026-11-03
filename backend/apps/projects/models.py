from django.conf import settings
from django.db import models

class ProjectMemberRole(models.Model):

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="member_roles",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_role_assignments",
    )
    role = models.ForeignKey(
        "teams.Role",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="project_assignments",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                name="unique_project_member_role",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.project.name}"


class Project(models.Model):

    class Status(models.TextChoices):
        PLANNED = "PLANNED", "Planifié"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        COMPLETED = "COMPLETED", "Terminé"
        ARCHIVED = "ARCHIVED", "Archivé"

    name = models.CharField(max_length=150)

    description = models.TextField(blank=True)

    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="project_memberships",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_projects",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNED,
    )

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
