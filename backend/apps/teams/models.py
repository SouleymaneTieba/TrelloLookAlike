from django.conf import settings
from django.db import models


class Team(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_teams",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class TeamMember(models.Model):

    class Role(models.TextChoices):
        PROJECT_MANAGER = "PROJECT_MANAGER", "Chef de projet"
        DEVELOPER = "DEVELOPER", "Développeur"
        DESIGNER = "DESIGNER", "Designer"
        TESTER = "TESTER", "Testeur"
        MEMBER = "MEMBER", "Membre"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_memberships",
    )

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="members",
    )

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.MEMBER,
    )

    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "team"],
                name="unique_user_team",
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.team.name}"