from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def copy_existing_member_roles(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    ProjectMemberRole = apps.get_model("projects", "ProjectMemberRole")
    TeamMember = apps.get_model("teams", "TeamMember")

    for project in Project.objects.iterator():
        user_ids = project.members.values_list("id", flat=True)
        for user_id in user_ids:
            membership = (
                TeamMember.objects.filter(user_id=user_id, is_active=True)
                .filter(role__slug="PROJECT_MANAGER")
                .values_list("role_id", flat=True)
                .first()
            )
            if membership is None:
                membership = (
                    TeamMember.objects.filter(user_id=user_id, is_active=True)
                    .values_list("role_id", flat=True)
                    .first()
                )
            ProjectMemberRole.objects.get_or_create(
                project_id=project.id,
                user_id=user_id,
                defaults={"role_id": membership},
            )


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0002_project_members"),
        ("teams", "0003_remove_member_role"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectMemberRole",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="member_roles", to="projects.project")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_role_assignments", to=settings.AUTH_USER_MODEL)),
                ("role", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="project_assignments", to="teams.role")),
            ],
        ),
        migrations.AddConstraint(
            model_name="projectmemberrole",
            constraint=models.UniqueConstraint(fields=("project", "user"), name="unique_project_member_role"),
        ),
        migrations.RunPython(copy_existing_member_roles, migrations.RunPython.noop),
    ]
