from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0004_default_project_status_in_progress"),
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
                default="PLANNED",
                max_length=20,
            ),
        ),
    ]
