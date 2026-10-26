import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0002_messagereaction"),
        ("projects", "0002_project_members"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="chat_messages",
                to="projects.project",
            ),
        ),
        migrations.AlterField(
            model_name="message",
            name="team",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="chat_messages",
                to="teams.team",
            ),
        ),
    ]
