from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0006_remove_feature_description"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="start_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="task",
            name="end_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
