from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_project_member_roles"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="status",
            field=models.CharField(
                choices=[
                    ("PLANNED", "Planifié"),
                    ("IN_PROGRESS", "En cours"),
                    ("COMPLETED", "Terminé"),
                    ("ARCHIVED", "Archivé"),
                ],
                default="IN_PROGRESS",
                max_length=20,
            ),
        ),
    ]
