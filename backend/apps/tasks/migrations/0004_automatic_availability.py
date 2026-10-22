from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0003_restore_prototype_schema"),
    ]

    operations = [
        migrations.AddField(
            model_name="taskavailabilityreport",
            name="is_automatic",
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name="taskavailabilityreport",
            constraint=models.UniqueConstraint(
                condition=models.Q(is_automatic=True),
                fields=("user", "team"),
                name="unique_automatic_availability_per_member_team",
            ),
        ),
    ]
