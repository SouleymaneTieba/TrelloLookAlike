from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def group_existing_tasks(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Feature = apps.get_model("tasks", "Feature")
    Task = apps.get_model("tasks", "Task")

    for project in Project.objects.iterator():
        if not Task.objects.filter(project_id=project.id).exists():
            continue

        feature = Feature.objects.create(
            project_id=project.id,
            title="Fonctionnalités existantes",
            description="Tâches déjà présentes avant la création des fonctionnalités.",
            created_by_id=project.created_by_id,
        )
        Task.objects.filter(project_id=project.id).update(feature_id=feature.id)


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0002_project_members"),
        ("tasks", "0004_automatic_availability"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Feature",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_features", to=settings.AUTH_USER_MODEL)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="features", to="projects.project")),
            ],
        ),
        migrations.AddField(
            model_name="task",
            name="feature",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="subtasks", to="tasks.feature"),
        ),
        migrations.RunPython(group_existing_tasks, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="task",
            name="feature",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subtasks", to="tasks.feature"),
        ),
    ]
