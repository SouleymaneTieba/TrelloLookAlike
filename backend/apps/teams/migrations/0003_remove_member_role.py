from django.db import migrations


def remove_member_role(apps, schema_editor):
    Role = apps.get_model("teams", "Role")
    TeamMember = apps.get_model("teams", "TeamMember")

    member_role = Role.objects.filter(slug="MEMBER").first()

    if not member_role:
        return

    fallback_role = (
        Role.objects.exclude(id=member_role.id)
        .order_by("label")
        .first()
    )

    if fallback_role:
        TeamMember.objects.filter(role=member_role).update(
            role=fallback_role
        )

    member_role.delete()


def restore_member_role(apps, schema_editor):
    Role = apps.get_model("teams", "Role")

    if not Role.objects.filter(slug="MEMBER").exists():
        Role.objects.create(
            slug="MEMBER",
            label="Membre",
            is_system=True,
            unique_per_team=False,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("teams", "0002_role_and_teammember_fk"),
    ]

    operations = [
        migrations.RunPython(
            remove_member_role,
            restore_member_role,
        ),
    ]
