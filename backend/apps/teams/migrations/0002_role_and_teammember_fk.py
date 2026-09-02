from django.db import migrations, models
import django.db.models.deletion


DEFAULT_ROLES = [
    ("PROJECT_MANAGER", "Chef de projet", True, True),
    ("DEVELOPER", "Développeur", True, False),
    ("DESIGNER", "Designer", True, False),
    ("TESTER", "Testeur", True, False),
    ("MEMBER", "Membre", True, False),
]


def seed_roles_and_assign(apps, schema_editor):

    Role = apps.get_model("teams", "Role")
    TeamMember = apps.get_model("teams", "TeamMember")

    roles_by_slug = {}

    for slug, label, is_system, unique_per_team in DEFAULT_ROLES:

        role, _created = Role.objects.get_or_create(
            slug=slug,
            defaults={
                "label": label,
                "is_system": is_system,
                "unique_per_team": unique_per_team,
            },
        )

        roles_by_slug[slug] = role

    default_role = roles_by_slug["MEMBER"]

    for member in TeamMember.objects.all():

        member.role_ref = roles_by_slug.get(
            member.role,
            default_role,
        )

        member.save(
            update_fields=["role_ref"],
        )


def unassign_roles(apps, schema_editor):

    TeamMember = apps.get_model("teams", "TeamMember")

    for member in TeamMember.objects.select_related("role_ref"):

        if member.role_ref_id:
            member.role = member.role_ref.slug
            member.save(update_fields=["role"])


class Migration(migrations.Migration):

    dependencies = [
        ("teams", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Role",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "slug",
                    models.CharField(max_length=50, unique=True),
                ),
                (
                    "label",
                    models.CharField(max_length=100, unique=True),
                ),
                (
                    "is_system",
                    models.BooleanField(default=False),
                ),
                (
                    "unique_per_team",
                    models.BooleanField(default=False),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True),
                ),
            ],
            options={
                "ordering": ["label"],
            },
        ),
        migrations.AddField(
            model_name="teammember",
            name="role_ref",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="members",
                to="teams.role",
            ),
        ),
        migrations.RunPython(
            seed_roles_and_assign,
            unassign_roles,
        ),
        migrations.RemoveField(
            model_name="teammember",
            name="role",
        ),
        migrations.RenameField(
            model_name="teammember",
            old_name="role_ref",
            new_name="role",
        ),
        migrations.AlterField(
            model_name="teammember",
            name="role",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="members",
                to="teams.role",
            ),
        ),
    ]
