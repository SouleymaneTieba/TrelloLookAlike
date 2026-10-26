from django.conf import settings
from django.db import migrations, models


def copy_team_members_to_projects(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    TeamMember = apps.get_model("teams", "TeamMember")

    for project in Project.objects.select_related("team").iterator():
        active_members = TeamMember.objects.filter(
            team_id=project.team_id,
            is_active=True,
        ).select_related("user", "role")

        for membership in active_members:
            project.members.add(membership.user_id)


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0001_initial"),
        ("teams", "0003_remove_member_role"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="members",
            field=models.ManyToManyField(
                blank=True,
                related_name="project_memberships",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(copy_team_members_to_projects, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="project",
            name="team",
        ),
    ]
