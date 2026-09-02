from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Role(models.Model):

    SLUG_PROJECT_MANAGER = "PROJECT_MANAGER"
    SLUG_MEMBER = "MEMBER"

    slug = models.CharField(
        max_length=50,
        unique=True,
    )

    label = models.CharField(
        max_length=100,
        unique=True,
    )

    is_system = models.BooleanField(
        default=False,
    )

    unique_per_team = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["label"]

    def __str__(self):
        return self.label

    @classmethod
    def make_slug(cls, label, exclude_id=None):

        base = (
            slugify(label)
            .replace("-", "_")
            .upper()
        ) or "ROLE"

        slug = base
        index = 2

        while True:

            queryset = cls.objects.filter(
                slug=slug,
            )

            if exclude_id:
                queryset = queryset.exclude(
                    id=exclude_id,
                )

            if not queryset.exists():
                return slug

            slug = f"{base}_{index}"
            index += 1


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

    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="members",
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
