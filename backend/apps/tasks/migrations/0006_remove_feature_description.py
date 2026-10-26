from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0005_features_and_subtasks"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="feature",
            name="description",
        ),
    ]
